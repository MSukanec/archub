import type { Request } from "express";
import { createServiceSupabaseClient } from "../shared/auth.js";
import { insertPayment } from "../shared/payments.js";
import { upgradeOrganizationPlan } from "../shared/subscriptions.js";
import { getPlanIdBySlug } from "../shared/helpers.js";
import { createMPPreapproval, type MPAutoRecurring } from "./subscriptions-api.js";
import { getUserData } from "../shared/user.js";
import { buildURLContext, buildSubscriptionBackUrls } from "../shared/urls.js";
import { getAdminClient } from "../../../../routes/_base.js";

export type HandleUpgradeReturnResult =
  | { success: true; activated: boolean; message: string; redirectUrl?: string }
  | { success: false; error: string };

export async function handleUpgradeReturn(req: Request): Promise<HandleUpgradeReturnResult> {
  const supabase = createServiceSupabaseClient();
  const adminClient = getAdminClient();
  
  const preferenceIdRaw = req.query.preference_id;
  const isFreeUpgrade = req.query.free === 'true';
  const paymentId = req.query.payment_id as string;
  const paymentStatus = req.query.status as string;
  
  let preferenceId: string | null = null;
  if (Array.isArray(preferenceIdRaw)) {
    const found = preferenceIdRaw.find((id) => typeof id === 'string' && id.startsWith('mpu_'));
    preferenceId = typeof found === 'string' ? found : (typeof preferenceIdRaw[0] === 'string' ? preferenceIdRaw[0] : null);
  } else if (typeof preferenceIdRaw === 'string') {
    preferenceId = preferenceIdRaw;
  }
  
  console.log("[MP upgrade-return] Processing upgrade return:", {
    preferenceIdRaw,
    preferenceId,
    isFreeUpgrade,
    paymentId,
    paymentStatus,
  });

  if (!preferenceId) {
    console.error("[MP upgrade-return] No preference_id in query");
    return { success: false, error: "Missing preference_id" };
  }

  const { data: prefData, error: prefError } = await adminClient
    .from("mp_subscription_preferences")
    .select("*")
    .eq("id", preferenceId)
    .maybeSingle();

  if (prefError || !prefData) {
    console.error("[MP upgrade-return] Preference not found:", prefError);
    return { success: false, error: "Preferencia de upgrade no encontrada" };
  }

  const { 
    user_id, 
    organization_id, 
    plan_slug, 
    plan_id,
    billing_period,
    amount_ars,
    previous_subscription_id,
    proration_credit,
    product_type,
  } = prefData;

  if (product_type !== 'subscription_upgrade') {
    console.error("[MP upgrade-return] Wrong product_type:", product_type);
    return { success: false, error: "Esta preferencia no es de upgrade" };
  }

  if (!organization_id || !plan_slug || !billing_period) {
    console.error("[MP upgrade-return] Missing data in preference:", prefData);
    return { success: false, error: "Datos incompletos en la preferencia" };
  }

  // RETROCOMPATIBILITY: user_id in mp_subscription_preferences can be either:
  // - NEW records (after fix): public.users.id
  // - OLD records (legacy): auth.users.id (auth_id)
  // We try both lookups to handle both cases
  let publicUserId: string | null = null;
  let authId: string | null = null;
  
  if (user_id) {
    console.log('[MP upgrade-return] Resolving user_id (could be public.users.id or auth_id):', { user_id });
    
    // First, try to find by id (new records)
    const { data: userById } = await supabase
      .from("users")
      .select("id, auth_id")
      .eq("id", user_id)
      .maybeSingle();
    
    if (userById) {
      // New record: user_id is public.users.id
      publicUserId = userById.id;
      authId = userById.auth_id;
      console.log('[MP upgrade-return] ✅ Resolved as public.users.id:', { publicUserId, authId });
    } else {
      // Fallback: try auth_id lookup (legacy records)
      const { data: userByAuth } = await supabase
        .from("users")
        .select("id, auth_id")
        .eq("auth_id", user_id)
        .maybeSingle();
      
      if (userByAuth) {
        publicUserId = userByAuth.id;
        authId = userByAuth.auth_id;
        console.log('[MP upgrade-return] ✅ Resolved as legacy auth_id:', { publicUserId, authId });
      } else {
        console.error('[MP upgrade-return] ❌ Failed to resolve user_id:', { user_id });
      }
    }
  }

  const resolvedPlanId = plan_id || await getPlanIdBySlug(supabase, plan_slug);
  
  if (!resolvedPlanId) {
    console.error("[MP upgrade-return] Plan not found:", plan_slug);
    return { success: false, error: "Plan no encontrado" };
  }

  const { data: existingSub } = await supabase
    .from("organization_subscriptions")
    .select("id, provider_subscription_id")
    .eq("organization_id", organization_id)
    .eq("plan_id", resolvedPlanId)
    .eq("status", "active")
    .maybeSingle();

  if (existingSub) {
    console.log("[MP upgrade-return] Subscription already exists:", existingSub.id);
    return { success: true, activated: true, message: "Suscripción ya activada" };
  }

  if (!isFreeUpgrade && paymentStatus !== 'approved') {
    console.log("[MP upgrade-return] Payment not approved, status:", paymentStatus);
    return { success: false, error: `Pago no aprobado. Estado: ${paymentStatus || 'pending'}` };
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("id, name, slug, monthly_amount, annual_amount")
    .eq("id", resolvedPlanId)
    .single();

  if (!plan) {
    return { success: false, error: "Plan no encontrado" };
  }

  let subscriptionStartDate: string | null = null;
  if (previous_subscription_id) {
    const { data: prevSub } = await supabase
      .from("organization_subscriptions")
      .select("expires_at")
      .eq("id", previous_subscription_id)
      .maybeSingle();
    
    if (prevSub?.expires_at) {
      subscriptionStartDate = prevSub.expires_at;
      console.log('[MP upgrade-return] Using previous subscription expiry as start_date:', subscriptionStartDate);
    }
  }

  if (!subscriptionStartDate) {
    const { data: activeSub } = await supabase
      .from("organization_subscriptions")
      .select("expires_at")
      .eq("organization_id", organization_id)
      .eq("status", "active")
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (activeSub?.expires_at) {
      subscriptionStartDate = activeSub.expires_at;
      console.log('[MP upgrade-return] Using active subscription expiry as start_date:', subscriptionStartDate);
    }
  }

  const { data: exchangeRate } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("from_currency", "USD")
    .eq("to_currency", "ARS")
    .eq("is_active", true)
    .single();

  const arsRate = exchangeRate ? parseFloat(exchangeRate.rate) : 1200;

  const fullPriceUSD = billing_period === 'monthly' 
    ? parseFloat(plan.monthly_amount) 
    : parseFloat(plan.annual_amount);
  const fullPriceARS = Math.round(fullPriceUSD * arsRate);

  console.log('[MP upgrade-return] Upgrade approved, creating recurring subscription:', {
    plan: plan.name,
    billing_period,
    fullPriceARS,
    prorationPaid: amount_ars,
    subscriptionStartDate,
  });

  let userEmail: string | null = null;
  if (authId) {
    const userData = await getUserData(supabase, authId);
    userEmail = userData.email;
  }

  if (!userEmail) {
    const { data: userRow } = await adminClient
      .from("users")
      .select("email")
      .eq("id", publicUserId)
      .maybeSingle();
    userEmail = userRow?.email || null;
  }

  if (!userEmail) {
    console.error('[MP upgrade-return] No email found for user');
    return { success: false, error: "Email del usuario no encontrado" };
  }

  const prorationAmountNum = parseFloat(amount_ars) || 0;
  const prorationPaymentResult = await insertPayment(supabase, "mercadopago", {
    providerPaymentId: paymentId || `upgrade_proration_${preferenceId}`,
    userId: publicUserId,
    amount: prorationAmountNum,
    currency: "ARS",
    status: "completed",
    productType: 'subscription_upgrade',
    organizationId: organization_id,
    productId: resolvedPlanId,
  });

  // If payment already exists (webhook processed it), get the existing payment ID and continue
  // We still need to activate the plan and create the recurring subscription
  if (!prorationPaymentResult.inserted && !isFreeUpgrade) {
    console.log("[MP upgrade-return] Proration payment already exists, continuing with activation...");
    // The paymentId is returned even when not inserted (from the duplicate check)
    if (!prorationPaymentResult.paymentId) {
      // Try to find the existing payment
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("provider_payment_id", paymentId)
        .maybeSingle();
      if (existingPayment) {
        prorationPaymentResult.paymentId = existingPayment.id;
      }
    }
  }

  const frequency = billing_period === 'monthly' ? 1 : 12;
  const frequencyType: "months" = "months";

  const autoRecurring: MPAutoRecurring = {
    frequency,
    frequency_type: frequencyType,
    transaction_amount: fullPriceARS,
    currency_id: "ARS",
    ...(subscriptionStartDate && { start_date: subscriptionStartDate }),
  };

  const productTitle = `Suscripción ${plan.name} - ${billing_period === 'monthly' ? 'Mensual' : 'Anual'}`;
  const urlContext = buildURLContext(req);
  const backUrls = buildSubscriptionBackUrls(urlContext.returnBase);

  console.log('[MP upgrade-return] Creating recurring subscription with preapproval:', {
    plan: plan.name,
    fullPriceARS,
    frequency,
    email: userEmail,
    startDate: subscriptionStartDate || 'immediate',
  });

  const preapprovalResult = await createMPPreapproval({
    reason: productTitle,
    external_reference: `mps_upgrade_${preferenceId}`,
    payer_email: userEmail,
    auto_recurring: autoRecurring,
    back_url: backUrls.success,
    status: "pending",
  });

  if (!preapprovalResult.success) {
    console.error("[MP upgrade-return] Failed to create preapproval:", preapprovalResult);
    
    if (prorationPaymentResult.paymentId) {
      await upgradeOrganizationPlan(supabase, {
        organizationId: organization_id,
        planId: resolvedPlanId,
        billingPeriod: billing_period as 'monthly' | 'annual',
        paymentId: prorationPaymentResult.paymentId,
        amount: prorationAmountNum,
        currency: "ARS",
        userId: publicUserId,
        payerEmail: userEmail, // Save MP email for seat billing
      });
    }

    return { 
      success: true, 
      activated: true, 
      message: "Upgrade activado pero la suscripción recurrente requiere configuración manual",
      redirectUrl: `/organization/billing?payment=success&recurring=pending`
    };
  }

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
      console.warn("[MP upgrade-return] Failed to cancel previous subscription:", cancelError);
    } else {
      console.log("[MP upgrade-return] Previous subscription cancelled:", previous_subscription_id);
    }
  }

  if (prorationPaymentResult.paymentId) {
    await upgradeOrganizationPlan(supabase, {
      organizationId: organization_id,
      planId: resolvedPlanId,
      billingPeriod: billing_period as 'monthly' | 'annual',
      paymentId: prorationPaymentResult.paymentId,
      amount: fullPriceARS,
      currency: "ARS",
      userId: publicUserId,
      providerSubscriptionId: preapprovalResult.preapprovalId,
      payerEmail: userEmail, // Save MP email for seat billing
    });
  }

  const { error: updatePrefError } = await adminClient
    .from("mp_subscription_preferences")
    .update({ 
      preapproval_id: preapprovalResult.preapprovalId,
    })
    .eq("id", preferenceId);

  if (updatePrefError) {
    console.warn('[MP upgrade-return] Failed to update preference with preapproval_id:', updatePrefError);
  }

  console.log("[MP upgrade-return] ✅ Upgrade completed successfully:", {
    organization_id,
    plan: plan.name,
    preapprovalId: preapprovalResult.preapprovalId,
    recurringAmount: fullPriceARS,
  });

  return { 
    success: true, 
    activated: true, 
    message: "Upgrade completado exitosamente",
    redirectUrl: preapprovalResult.initPoint,
  };
}
