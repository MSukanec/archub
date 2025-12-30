import type { Request } from "express";
import { nanoid } from "nanoid";
import { getAuthenticatedClient } from "../shared/auth.js";
import { verifyAdminRoleForOrganization } from "../shared/permissions.js";
import { buildURLContext } from "../shared/urls.js";
import { calculateProration } from "../shared/proration.js";
import { getAdminClient } from "../../../../routes/_base.js";
import { createPayPalOrder } from "./api.js";
import { getPayPalMode } from "./config.js";

export type CreateUpgradeOrderResult =
  | { success: true; orderId: string; approvalUrl: string; isFreeUpgrade?: boolean }
  | { success: false; error: string; status?: number };

export async function createUpgradeOrder(req: Request): Promise<CreateUpgradeOrderResult> {
  const { 
    plan_slug,
    organization_id,
    billing_period,
  } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  if (!plan_slug || !organization_id || !billing_period) {
    return { 
      success: false, 
      error: "Falta plan_slug, organization_id o billing_period", 
      status: 400 
    };
  }

  if (billing_period !== 'monthly' && billing_period !== 'annual') {
    return {
      success: false,
      error: "billing_period debe ser 'monthly' o 'annual'",
      status: 400
    };
  }

  const authResult = getAuthenticatedClient(req);
  if (!authResult.success) {
    return { success: false, error: authResult.error, status: 401 };
  }

  const { supabase } = authResult;

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('[PayPal create-upgrade-order] Auth error:', userError);
    return { success: false, error: "Autenticación fallida", status: 401 };
  }

  const authId = user.id;

  try {
    const adminCheck = await verifyAdminRoleForOrganization(supabase, authId, organization_id);
    
    if (!adminCheck.success) {
      return { 
        success: false, 
        error: adminCheck.error, 
        status: 403 
      };
    }

    const adminClient = getAdminClient();
    
    const { data: dbUser, error: dbUserError } = await adminClient
      .from("users")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (dbUserError || !dbUser) {
      console.error('[PayPal create-upgrade-order] User not found:', dbUserError);
      return { success: false, error: "Usuario no encontrado", status: 404 };
    }

    const userId = dbUser.id;

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, slug, is_active, monthly_amount, annual_amount, paypal_plan_monthly_id, paypal_plan_annual_id, paypal_plan_monthly_id_sandbox, paypal_plan_annual_id_sandbox")
      .eq("slug", plan_slug)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      console.error('[PayPal create-upgrade-order] Plan not found:', planError);
      return { success: false, error: "Plan no encontrado o inactivo", status: 404 };
    }

    const prorationResult = await calculateProration(adminClient, {
      organizationId: organization_id,
      targetPlanSlug: plan_slug,
      billingPeriod: billing_period as 'monthly' | 'annual',
    });

    console.log('[PayPal create-upgrade-order] Proration calculated:', {
      hasActiveSubscription: prorationResult.hasActiveSubscription,
      currentPlan: prorationResult.currentPlan?.name,
      targetPlan: prorationResult.targetPlan.name,
      credit: prorationResult.credit,
      finalPrice: prorationResult.finalPrice,
      savings: prorationResult.savings,
    });

    if (!prorationResult.hasActiveSubscription) {
      return { 
        success: false, 
        error: "No hay suscripción activa para hacer upgrade. Use la ruta de suscripción normal.", 
        status: 400 
      };
    }

    let prorationAmountUSD = prorationResult.finalPrice.usd;

    // Get PayPal mode from database feature flag
    const isPayPalSandbox = await getPayPalMode();

    if (prorationAmountUSD <= 0) {
      console.log('[PayPal create-upgrade-order] Free upgrade (credit >= new price)');
      
      const shortId = `ppu_${nanoid(12)}`;
      // Use sandbox or production plan IDs based on mode
      const targetPaypalPlanId = billing_period === 'monthly' 
        ? (isPayPalSandbox ? plan.paypal_plan_monthly_id_sandbox : plan.paypal_plan_monthly_id)
        : (isPayPalSandbox ? plan.paypal_plan_annual_id_sandbox : plan.paypal_plan_annual_id);
      const fullPriceUsd = String(billing_period === 'monthly' ? plan.monthly_amount : plan.annual_amount);
      
      const { returnBase } = buildURLContext(req);
      const freeUpgradeUrl = `${returnBase}/api/checkout/paypal/upgrade-capture?preference_id=${shortId}&free=true`;
      
      const { error: insertError } = await adminClient
        .from("paypal_upgrade_preferences")
        .insert({
          id: shortId,
          user_id: userId,
          organization_id,
          plan_id: plan.id,
          plan_slug,
          billing_period,
          amount_usd: "0",
          previous_subscription_id: prorationResult.currentSubscription?.id || null,
          proration_credit: String(prorationResult.savings.usd),
          full_price_usd: fullPriceUsd,
          target_paypal_plan_id: targetPaypalPlanId,
        });

      if (insertError) {
        console.error("[PayPal create-upgrade-order] Error saving preference to DB:", insertError);
      }

      return { 
        success: true, 
        orderId: shortId,
        approvalUrl: freeUpgradeUrl,
        isFreeUpgrade: true,
      };
    }

    if (prorationAmountUSD < 1) {
      prorationAmountUSD = 1;
      console.log('[PayPal create-upgrade-order] Adjusted proration to minimum $1 USD');
    }

    const shortId = `ppu_${nanoid(12)}`;
    // Use sandbox or production plan IDs based on mode
    const targetPaypalPlanId = billing_period === 'monthly' 
      ? (isPayPalSandbox ? plan.paypal_plan_monthly_id_sandbox : plan.paypal_plan_monthly_id)
      : (isPayPalSandbox ? plan.paypal_plan_annual_id_sandbox : plan.paypal_plan_annual_id);
    
    console.log('[PayPal create-upgrade-order] Target PayPal Plan ID:', {
      planName: plan.name,
      planSlug: plan.slug,
      billingPeriod: billing_period,
      targetPaypalPlanId,
      isSandbox: isPayPalSandbox,
    });

    if (!targetPaypalPlanId) {
      console.error('[PayPal create-upgrade-order] WARNING: No PayPal plan ID for target plan!');
    }

    const { error: insertError } = await adminClient
      .from("paypal_upgrade_preferences")
      .insert({
        id: shortId,
        user_id: userId,
        organization_id,
        plan_id: plan.id,
        plan_slug,
        billing_period,
        amount_usd: String(prorationAmountUSD),
        previous_subscription_id: prorationResult.currentSubscription?.id || null,
        proration_credit: String(prorationResult.savings.usd),
        full_price_usd: String(billing_period === 'monthly' ? plan.monthly_amount : plan.annual_amount),
        target_paypal_plan_id: targetPaypalPlanId,
      });

    if (insertError) {
      console.error("[PayPal create-upgrade-order] Error saving preference to DB:", insertError);
    }

    const productTitle = `Upgrade a ${plan.name} - Pago prorrateado`;
    const productDescription = `Diferencia prorrateada para upgrade de plan`;

    const { returnBase } = buildURLContext(req);
    const uniqueInvoiceId = `upgrade_${organization_id}_${Date.now()}`;
    const custom_id = `${userId}|${plan.id}|${organization_id}|${billing_period}|upgrade|${shortId}`;

    const return_url = `${returnBase}/api/checkout/paypal/upgrade-capture?preference_id=${shortId}`;
    const cancel_url = `${returnBase}/organization/billing?payment=cancelled`;

    const orderBody = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: prorationAmountUSD.toFixed(2),
          },
          description: productDescription,
          invoice_id: uniqueInvoiceId,
          custom_id: custom_id,
        },
      ],
      application_context: {
        brand_name: "Seencel",
        user_action: "PAY_NOW",
        return_url,
        cancel_url,
      },
    };

    console.log('[PayPal create-upgrade-order] Creating order:', {
      plan: plan.name,
      billing_period,
      proration_amount: prorationAmountUSD,
      full_price: prorationResult.targetPlan.priceUSD,
      credit: prorationResult.savings.usd,
      shortId,
    });

    const result = await createPayPalOrder(orderBody);

    if (!result.success) {
      console.error("[PayPal create-upgrade-order] Error creating order:", result);
      return { success: false, error: result.error, status: result.status };
    }

    const { error: updateError } = await adminClient
      .from("paypal_upgrade_preferences")
      .update({ order_id: result.orderId })
      .eq("id", shortId);
    
    if (updateError) {
      console.warn('[PayPal create-upgrade-order] Failed to update preference with order_id:', updateError);
    }

    console.log('[PayPal create-upgrade-order] Order created successfully:', {
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
      plan_slug,
      billing_period,
      prorationAmount: prorationAmountUSD,
      shortId,
    });

    return { 
      success: true, 
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
    };
  } catch (error: any) {
    console.error("[PayPal create-upgrade-order] Unexpected error:", error);
    return { 
      success: false, 
      error: error.message || "Error inesperado", 
      status: 500 
    };
  }
}
