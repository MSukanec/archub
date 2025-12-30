import type { Request } from "express";
import { createServiceSupabaseClient } from "../shared/auth.js";
import { getAdminClient } from "../../../../routes/_base.js";
import { insertPayment } from "../shared/payments.js";
import { upgradeOrganizationPlan } from "../shared/subscriptions.js";
import { buildURLContext } from "../shared/urls.js";
import { capturePayPalOrder, getPayPalOrder } from "./api.js";
import { createPayPalSubscription, cancelPayPalSubscription, revisePayPalSubscription } from "./subscriptions-api.js";
import { isPayPalSandbox } from "./config.js";

export type HandleUpgradeCaptureResult =
  | { success: true; activated: boolean; message: string; redirectUrl: string; approvalUrl?: string }
  | { success: false; error: string; redirectUrl?: string };

export async function handleUpgradeCapture(req: Request): Promise<HandleUpgradeCaptureResult> {
  const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';
  const supabase = createServiceSupabaseClient();
  const adminClient = getAdminClient();
  
  const preferenceIdRaw = req.query.preference_id;
  const isFreeUpgrade = req.query.free === 'true';
  const token = req.query.token as string; // PayPal token (order ID)
  
  let preferenceId: string | null = null;
  if (Array.isArray(preferenceIdRaw)) {
    const found = preferenceIdRaw.find((id) => typeof id === 'string' && id.startsWith('ppu_'));
    preferenceId = typeof found === 'string' ? found : (typeof preferenceIdRaw[0] === 'string' ? preferenceIdRaw[0] : null);
  } else if (typeof preferenceIdRaw === 'string') {
    preferenceId = preferenceIdRaw;
  }
  
  console.log("[PayPal upgrade-capture] Processing upgrade capture:", {
    preferenceIdRaw,
    preferenceId,
    isFreeUpgrade,
    token,
  });

  if (!preferenceId) {
    console.error("[PayPal upgrade-capture] No preference_id in query");
    return { success: false, error: "Missing preference_id", redirectUrl: `${baseUrl}/organization/billing?payment=error&reason=missing_preference` };
  }

  const { data: prefData, error: prefError } = await adminClient
    .from("paypal_upgrade_preferences")
    .select("*")
    .eq("id", preferenceId)
    .maybeSingle();

  if (prefError || !prefData) {
    console.error("[PayPal upgrade-capture] Preference not found:", prefError);
    return { success: false, error: "Preference not found", redirectUrl: `${baseUrl}/organization/billing?payment=error&reason=preference_not_found` };
  }

  const { 
    user_id, 
    organization_id, 
    plan_slug, 
    plan_id,
    billing_period,
    amount_usd,
    previous_subscription_id,
    proration_credit,
    target_paypal_plan_id,
    order_id,
  } = prefData;

  if (!organization_id || !plan_slug || !billing_period) {
    console.error("[PayPal upgrade-capture] Missing data in preference:", prefData);
    return { success: false, error: "Incomplete data", redirectUrl: `${baseUrl}/organization/billing?payment=error&reason=incomplete_data` };
  }

  // NOTE: user_id from preference is already the public user ID (from users table), not auth_id
  // This is set in createUpgradeOrder.ts where we query users by auth_id and store the resulting id
  const publicUserId = user_id;
  console.log('[PayPal upgrade-capture] Using user_id from preference:', publicUserId);

  // Get plan data
  let resolvedPlanId = plan_id;
  let plan: any = null;
  
  if (plan_id) {
    const { data: planData } = await supabase
      .from("plans")
      .select("id, name, slug, monthly_amount, annual_amount, paypal_plan_monthly_id, paypal_plan_annual_id, paypal_plan_monthly_id_sandbox, paypal_plan_annual_id_sandbox")
      .eq("id", plan_id)
      .maybeSingle();
    plan = planData;
  } else if (plan_slug) {
    const { data: planData } = await supabase
      .from("plans")
      .select("id, name, slug, monthly_amount, annual_amount, paypal_plan_monthly_id, paypal_plan_annual_id, paypal_plan_monthly_id_sandbox, paypal_plan_annual_id_sandbox")
      .eq("slug", plan_slug)
      .eq("is_active", true)
      .maybeSingle();
    plan = planData;
    if (planData) resolvedPlanId = planData.id;
  }

  if (!plan) {
    console.error("[PayPal upgrade-capture] Plan not found");
    return { success: false, error: "Plan not found", redirectUrl: `${baseUrl}/organization/billing?payment=error&reason=plan_not_found` };
  }

  // For free upgrades, skip payment capture
  let paymentId: string | null = null;
  let captureData: any = null;
  
  if (!isFreeUpgrade) {
    // Capture the PayPal order
    const orderIdToCapture = order_id || token;
    if (!orderIdToCapture) {
      console.error("[PayPal upgrade-capture] No order_id to capture");
      return { success: false, error: "No order ID", redirectUrl: `${baseUrl}/organization/billing?payment=error&reason=no_order_id` };
    }

    try {
      // First check order status
      const orderDetails = await getPayPalOrder(orderIdToCapture);
      console.log('[PayPal upgrade-capture] Order status:', orderDetails.status);
      
      if (orderDetails.status === 'COMPLETED') {
        console.log('[PayPal upgrade-capture] Order already captured');
        captureData = orderDetails;
      } else if (orderDetails.status === 'APPROVED') {
        console.log('[PayPal upgrade-capture] Capturing order:', orderIdToCapture);
        captureData = await capturePayPalOrder(orderIdToCapture);
        console.log('[PayPal upgrade-capture] Capture result:', captureData.status);
      } else {
        console.error('[PayPal upgrade-capture] Order not approved:', orderDetails.status);
        return { success: false, error: "Order not approved", redirectUrl: `${baseUrl}/organization/billing?payment=error&reason=order_not_approved` };
      }
    } catch (captureError: any) {
      console.error("[PayPal upgrade-capture] Error capturing order:", captureError);
      return { success: false, error: "Capture failed", redirectUrl: `${baseUrl}/organization/billing?payment=error&reason=capture_failed` };
    }

    // Insert payment record
    const prorationAmountNum = parseFloat(amount_usd) || 0;
    const payPalPaymentId = captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id || 
                           `upgrade_proration_${preferenceId}`;
    
    const paymentResult = await insertPayment(supabase, "paypal", {
      providerPaymentId: payPalPaymentId,
      userId: publicUserId,
      amount: prorationAmountNum,
      currency: "USD",
      status: "completed",
      productType: 'subscription_upgrade',
      organizationId: organization_id,
      productId: resolvedPlanId,
    });

    paymentId = paymentResult.paymentId || null;
    console.log('[PayPal upgrade-capture] Payment recorded:', paymentId);
  }

  // Get user email for creating new subscription
  // publicUserId is the internal users table ID, so we query directly by id
  let userEmail: string | null = null;
  if (publicUserId) {
    const { data: userRow } = await adminClient
      .from("users")
      .select("email")
      .eq("id", publicUserId)
      .maybeSingle();
    userEmail = userRow?.email || null;
    console.log('[PayPal upgrade-capture] Found email for user:', userEmail ? 'yes' : 'no');
  }

  if (!userEmail) {
    console.error('[PayPal upgrade-capture] No email found for user:', publicUserId);
    return { success: false, error: "No email found", redirectUrl: `${baseUrl}/organization/billing?payment=error&reason=no_email` };
  }

  // Get the target PayPal plan ID for the new plan (use sandbox or production columns based on mode)
  const paypalPlanId = target_paypal_plan_id || 
                       (billing_period === 'monthly' 
                         ? (isPayPalSandbox ? plan.paypal_plan_monthly_id_sandbox : plan.paypal_plan_monthly_id)
                         : (isPayPalSandbox ? plan.paypal_plan_annual_id_sandbox : plan.paypal_plan_annual_id));

  // Get the old subscription to try revising it
  // Use adminClient to bypass RLS and ensure we can read the subscription
  const { data: oldSub, error: oldSubError } = await adminClient
    .from("organization_subscriptions")
    .select("id, provider_subscription_id, payment_provider, status")
    .eq("id", previous_subscription_id)
    .maybeSingle();
  
  if (oldSubError) {
    console.error('[PayPal upgrade-capture] Error fetching old subscription:', oldSubError);
  }

  const prorationAmountNum = parseFloat(amount_usd) || 0;
  const { returnBase } = buildURLContext(req);

  // Debug logging for revise condition
  console.log('[PayPal upgrade-capture] Revise condition check:', {
    previous_subscription_id,
    oldSubError: oldSubError?.message || null,
    oldSub: oldSub ? {
      id: oldSub.id,
      provider_subscription_id: oldSub.provider_subscription_id,
      payment_provider: oldSub.payment_provider,
      status: oldSub.status,
    } : null,
    paypalPlanId,
    willAttemptRevise: !!(oldSub?.provider_subscription_id && oldSub.payment_provider === 'paypal' && paypalPlanId),
  });

  // Try to REVISE the existing PayPal subscription instead of cancel+create
  // This is cleaner and may not require re-approval if user paid with card
  if (oldSub?.provider_subscription_id && oldSub.payment_provider === 'paypal' && paypalPlanId) {
    console.log('[PayPal upgrade-capture] Attempting to revise existing subscription:', {
      oldSubscriptionId: oldSub.provider_subscription_id,
      newPlanId: paypalPlanId,
    });

    const reviseResult = await revisePayPalSubscription({
      subscriptionId: oldSub.provider_subscription_id,
      newPlanId: paypalPlanId,
      returnUrl: `${returnBase}/organization/billing?payment=success&upgraded=true`,
      cancelUrl: `${returnBase}/organization/billing?payment=cancelled`,
    });

    if (reviseResult.success) {
      if (!reviseResult.requiresApproval) {
        // Card payment - revision applied automatically!
        console.log('[PayPal upgrade-capture] Subscription revised automatically (card payment)');
        
        // Update the subscription in DB with new plan
        await upgradeOrganizationPlan(supabase, {
          organizationId: organization_id,
          planId: resolvedPlanId,
          billingPeriod: billing_period as 'monthly' | 'annual',
          paymentId: paymentId || `upgrade_${preferenceId}`,
          amount: prorationAmountNum,
          currency: "USD",
          userId: publicUserId,
          payerEmail: userEmail,
          providerSubscriptionId: oldSub.provider_subscription_id, // Keep the same subscription ID
        });

        return { 
          success: true, 
          activated: true, 
          message: "Upgrade completado exitosamente",
          redirectUrl: `${baseUrl}/organization/billing?payment=success`,
        };
      } else {
        // PayPal account payment - requires approval, but just for the plan change, not a new subscription
        console.log('[PayPal upgrade-capture] Subscription revision requires approval');
        
        // Update the plan in DB now (will be confirmed when user approves)
        await upgradeOrganizationPlan(supabase, {
          organizationId: organization_id,
          planId: resolvedPlanId,
          billingPeriod: billing_period as 'monthly' | 'annual',
          paymentId: paymentId || `upgrade_${preferenceId}`,
          amount: prorationAmountNum,
          currency: "USD",
          userId: publicUserId,
          payerEmail: userEmail,
          providerSubscriptionId: oldSub.provider_subscription_id,
        });

        return { 
          success: true, 
          activated: true, 
          message: "Upgrade activado, confirma el cambio de plan en PayPal",
          redirectUrl: reviseResult.approvalUrl,
          approvalUrl: reviseResult.approvalUrl,
        };
      }
    } else {
      console.warn('[PayPal upgrade-capture] Revise failed, falling back to cancel+create:', reviseResult.error);
      // Fall through to cancel+create flow below
    }
  }

  // Fallback: Cancel old subscription and create new one
  // This happens if revise failed or if there's no existing PayPal subscription
  if (oldSub?.provider_subscription_id && oldSub.payment_provider === 'paypal') {
    console.log('[PayPal upgrade-capture] Cancelling old PayPal subscription:', oldSub.provider_subscription_id);
    try {
      const cancelResult = await cancelPayPalSubscription(oldSub.provider_subscription_id, "Upgrade to new plan");
      if (cancelResult.success) {
        console.log('[PayPal upgrade-capture] Old subscription cancelled successfully');
      } else {
        console.warn('[PayPal upgrade-capture] Failed to cancel old subscription:', cancelResult.error);
      }
    } catch (e) {
      console.warn('[PayPal upgrade-capture] Error cancelling old subscription:', e);
    }
  }

  // Mark old subscription as cancelled in DB
  if (previous_subscription_id) {
    const { error: cancelError } = await supabase
      .from("organization_subscriptions")
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        scheduled_downgrade_plan_id: null,
      })
      .eq("id", previous_subscription_id);

    if (cancelError) {
      console.warn("[PayPal upgrade-capture] Failed to cancel previous subscription in DB:", cancelError);
    } else {
      console.log("[PayPal upgrade-capture] Previous subscription cancelled:", previous_subscription_id);
    }
  }

  // Create new PayPal recurring subscription
  let newSubscriptionId: string | null = null;
  
  if (paypalPlanId) {
    console.log('[PayPal upgrade-capture] Creating new recurring subscription with plan:', paypalPlanId);
    
    const custom_id = `${user_id}|${resolvedPlanId}|${organization_id}|${billing_period}`;
    const return_url = `${returnBase}/api/checkout/paypal/capture-subscription?type=recurring`;
    const cancel_url = `${returnBase}/organization/billing?payment=cancelled`;

    const subscriptionResult = await createPayPalSubscription({
      planId: paypalPlanId,
      subscriber: {
        email_address: userEmail,
      },
      customId: custom_id,
      returnUrl: return_url,
      cancelUrl: cancel_url,
      brandName: "Seencel",
    });

    if (subscriptionResult.success) {
      newSubscriptionId = subscriptionResult.subscriptionId;
      console.log('[PayPal upgrade-capture] New subscription created:', newSubscriptionId);
      
      await upgradeOrganizationPlan(supabase, {
        organizationId: organization_id,
        planId: resolvedPlanId,
        billingPeriod: billing_period as 'monthly' | 'annual',
        paymentId: paymentId || `upgrade_${preferenceId}`,
        amount: prorationAmountNum,
        currency: "USD",
        userId: publicUserId,
        payerEmail: userEmail,
        providerSubscriptionId: newSubscriptionId,
      });

      console.log('[PayPal upgrade-capture] Redirecting to subscription approval:', subscriptionResult.approvalUrl);
      return { 
        success: true, 
        activated: true, 
        message: "Upgrade activado, redirigiendo a PayPal para confirmar suscripción",
        redirectUrl: subscriptionResult.approvalUrl,
        approvalUrl: subscriptionResult.approvalUrl,
      };
    } else {
      console.error('[PayPal upgrade-capture] Failed to create new subscription:', subscriptionResult.error);
      
      await upgradeOrganizationPlan(supabase, {
        organizationId: organization_id,
        planId: resolvedPlanId,
        billingPeriod: billing_period as 'monthly' | 'annual',
        paymentId: paymentId || `upgrade_${preferenceId}`,
        amount: prorationAmountNum,
        currency: "USD",
        userId: publicUserId,
        payerEmail: userEmail,
      });

      return { 
        success: true, 
        activated: true, 
        message: "Upgrade activado pero la suscripción recurrente requiere configuración manual",
        redirectUrl: `${baseUrl}/organization/billing?payment=success&recurring=pending`,
      };
    }
  } else {
    // No PayPal plan ID available, just activate without recurring
    console.log('[PayPal upgrade-capture] No PayPal plan ID, activating without recurring');
    
    await upgradeOrganizationPlan(supabase, {
      organizationId: organization_id,
      planId: resolvedPlanId,
      billingPeriod: billing_period as 'monthly' | 'annual',
      paymentId: paymentId || `upgrade_${preferenceId}`,
      amount: prorationAmountNum,
      currency: "USD",
      userId: publicUserId,
      payerEmail: userEmail,
    });

    return { 
      success: true, 
      activated: true, 
      message: "Upgrade completado exitosamente",
      redirectUrl: `${baseUrl}/organization/billing?payment=success`,
    };
  }
}
