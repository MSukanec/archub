import type { Request } from "express";
import { getAuthenticatedClient } from "../shared/auth.js";
import { verifyAdminRoleForOrganization } from "../shared/permissions.js";
import { updateMPPreapproval, getMPPreapproval } from "./subscriptions-api.js";
import { getAdminClient } from "../../../../routes/_base.js";

export type UpdateSubscriptionParams = {
  organization_id: string;
  new_plan_slug: string;
  billing_period?: 'monthly' | 'annual';
};

export type UpdateSubscriptionResult =
  | { 
      success: true; 
      message: string;
      details: {
        old_plan: string;
        new_plan: string;
        new_amount_ars: number;
        preapproval_id: string;
      };
    }
  | { success: false; error: string; status?: number };

export async function updateMPSubscription(req: Request): Promise<UpdateSubscriptionResult> {
  console.log("[MP updateSubscription] Starting subscription update...");

  const { 
    organization_id,
    new_plan_slug,
    billing_period: requestedBillingPeriod,
  } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  if (!organization_id || !new_plan_slug) {
    return { 
      success: false, 
      error: "Falta organization_id o new_plan_slug", 
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
    console.error('[MP updateSubscription] Auth error:', userError);
    return { success: false, error: "Autenticación fallida", status: 401 };
  }

  // Look up actual user ID from auth_id in users table (same pattern as PayPal)
  const { data: userRecord, error: userLookupError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  
  if (userLookupError || !userRecord) {
    console.error("[MP updateSubscription] User lookup failed:", userLookupError);
    return { success: false, error: "Usuario no encontrado", status: 404 };
  }

  const user_id = userRecord.id;
  const auth_id = user.id;

  try {
    // verifyAdminRoleForOrganization expects auth_id
    const adminCheck = await verifyAdminRoleForOrganization(supabase, auth_id, organization_id);
    
    if (!adminCheck.success) {
      return { 
        success: false, 
        error: adminCheck.error, 
        status: 403 
      };
    }

    const { data: currentSubscription, error: subError } = await supabase
      .from("organization_subscriptions")
      .select(`
        id,
        plan_id,
        status,
        billing_period,
        provider_subscription_id,
        payment_gateway,
        amount,
        currency,
        expires_at,
        plans:plan_id (id, name, slug)
      `)
      .eq("organization_id", organization_id)
      .in("status", ["active", "trialing"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('[MP updateSubscription] Error fetching current subscription:', subError);
      return { success: false, error: "Error al obtener suscripción actual", status: 500 };
    }

    if (!currentSubscription) {
      return { 
        success: false, 
        error: "No hay suscripción activa para esta organización", 
        status: 404 
      };
    }

    if (!currentSubscription.provider_subscription_id) {
      return { 
        success: false, 
        error: "La suscripción actual no tiene un ID de MercadoPago asociado. No se puede actualizar nativamente.", 
        status: 400 
      };
    }

    const preapprovalId = currentSubscription.provider_subscription_id;
    const billingPeriod = requestedBillingPeriod || currentSubscription.billing_period || 'monthly';
    const oldPlanData = currentSubscription.plans as any;
    const oldPlanName = oldPlanData?.name || 'Plan anterior';
    const oldPlanSlug = oldPlanData?.slug || '';

    if (oldPlanSlug === new_plan_slug) {
      return { 
        success: false, 
        error: "El nuevo plan es igual al plan actual", 
        status: 400 
      };
    }

    const { data: newPlan, error: planError } = await supabase
      .from("plans")
      .select("id, name, slug, is_active, monthly_amount, annual_amount")
      .eq("slug", new_plan_slug)
      .eq("is_active", true)
      .single();

    if (planError || !newPlan) {
      console.error('[MP updateSubscription] New plan not found:', planError);
      return { success: false, error: "Plan nuevo no encontrado o inactivo", status: 404 };
    }

    const priceAmountUSD = billingPeriod === 'monthly' 
      ? newPlan.monthly_amount 
      : newPlan.annual_amount;
    
    const basePriceUSD = Number(priceAmountUSD);

    if (!Number.isFinite(basePriceUSD) || basePriceUSD <= 0) {
      console.error('[MP updateSubscription] Invalid price for new plan:', {
        new_plan_slug,
        billing_period: billingPeriod,
        monthly_amount: newPlan.monthly_amount,
        annual_amount: newPlan.annual_amount
      });
      return { success: false, error: "Precio inválido para el nuevo plan", status: 500 };
    }

    const { data: exchangeRate, error: exchangeError } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_currency", "USD")
      .eq("to_currency", "ARS")
      .eq("is_active", true)
      .single();

    if (exchangeError || !exchangeRate) {
      console.error('[MP updateSubscription] Exchange rate not found:', exchangeError);
      return { success: false, error: "Tasa de cambio no disponible", status: 500 };
    }

    const arsRate = Number(exchangeRate.rate);
    const newAmountARS = Math.round(basePriceUSD * arsRate);

    console.log('[MP updateSubscription] Preparing MP update:', {
      preapprovalId,
      oldPlan: oldPlanName,
      newPlan: newPlan.name,
      billingPeriod,
      newAmountARS,
      basePriceUSD,
      arsRate,
    });

    const preapprovalCheck = await getMPPreapproval(preapprovalId);
    if (!preapprovalCheck.success) {
      console.error('[MP updateSubscription] Failed to verify preapproval exists:', preapprovalCheck.error);
      return { 
        success: false, 
        error: "No se pudo verificar la suscripción en MercadoPago. Es posible que haya sido cancelada.", 
        status: 400 
      };
    }

    const mpPreapproval = preapprovalCheck.preapproval;
    if (mpPreapproval.status !== 'authorized') {
      console.warn('[MP updateSubscription] Preapproval is not authorized:', mpPreapproval.status);
      return {
        success: false,
        error: `La suscripción en MercadoPago tiene estado "${mpPreapproval.status}". Solo se pueden modificar suscripciones autorizadas.`,
        status: 400
      };
    }

    const updateResult = await updateMPPreapproval(preapprovalId, {
      auto_recurring: {
        transaction_amount: newAmountARS,
        currency_id: "ARS",
      },
      reason: `Upgrade a ${newPlan.name} - ${billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}`,
    });

    if (!updateResult.success) {
      console.error('[MP updateSubscription] MercadoPago update failed:', updateResult);
      return { 
        success: false, 
        error: updateResult.error || "Error al actualizar suscripción en MercadoPago", 
        status: updateResult.status || 500 
      };
    }

    console.log('[MP updateSubscription] MercadoPago preapproval updated successfully:', {
      preapprovalId,
      newAmount: newAmountARS,
    });

    const adminClient = getAdminClient();

    const { error: updateSubError } = await adminClient
      .from("organization_subscriptions")
      .update({
        plan_id: newPlan.id,
        amount: newAmountARS,
        currency: "ARS",
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentSubscription.id);

    if (updateSubError) {
      console.error('[MP updateSubscription] Failed to update local subscription:', updateSubError);
      return { 
        success: false, 
        error: "Suscripción actualizada en MercadoPago pero falló la actualización local. Contacte soporte.", 
        status: 500 
      };
    }

    const { error: updateOrgError } = await adminClient
      .from("organizations")
      .update({ 
        plan_id: newPlan.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organization_id);

    if (updateOrgError) {
      console.error('[MP updateSubscription] Failed to update organization plan_id:', updateOrgError);
    }

    console.log('[MP updateSubscription] Subscription updated successfully:', {
      organization_id,
      subscription_id: currentSubscription.id,
      old_plan: oldPlanName,
      new_plan: newPlan.name,
      new_amount_ars: newAmountARS,
    });

    return {
      success: true,
      message: `Plan actualizado exitosamente de ${oldPlanName} a ${newPlan.name}`,
      details: {
        old_plan: oldPlanName,
        new_plan: newPlan.name,
        new_amount_ars: newAmountARS,
        preapproval_id: preapprovalId,
      },
    };

  } catch (e: any) {
    console.error("[MP updateSubscription] Fatal error:", e);
    return { success: false, error: e.message || String(e), status: 500 };
  }
}
