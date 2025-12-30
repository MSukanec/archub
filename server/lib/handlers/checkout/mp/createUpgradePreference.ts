import type { Request } from "express";
import { nanoid } from "nanoid";
import { getAuthenticatedClient } from "../shared/auth.js";
import { verifyAdminRoleForOrganization } from "../shared/permissions.js";
import { getUserData } from "../shared/user.js";
import { buildURLContext } from "../shared/urls.js";
import { validateMPToken, logMPMode, MP_WEBHOOK_SECRET } from "./config.js";
import { createMPPreference } from "./api.js";
import { calculateProration } from "../shared/proration.js";
import { getAdminClient } from "../../../../routes/_base.js";

export type CreateUpgradePreferenceResult =
  | { success: true; initPoint: string; preferenceId: string; isFreeUpgrade?: boolean }
  | { success: false; error: string; status?: number };

export async function createUpgradePreference(req: Request): Promise<CreateUpgradePreferenceResult> {
  logMPMode("create-upgrade-preference");

  const { 
    plan_slug,
    organization_id,
    billing_period,
    currency = "ARS",
    payer_email: clientPayerEmail,
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
    console.error('[MP create-upgrade-preference] Auth error:', userError);
    return { success: false, error: "Autenticación fallida", status: 401 };
  }

  // Look up actual user ID from auth_id in users table (same pattern as PayPal)
  const { data: userRecord, error: userLookupError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  
  if (userLookupError || !userRecord) {
    console.error("[MP create-upgrade-preference] User lookup failed:", userLookupError);
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

    // PROTECTION: Check for recent pending upgrade preferences (prevent duplicate clicks)
    const adminClient = getAdminClient();
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: recentPreferences } = await adminClient
      .from("mp_subscription_preferences")
      .select("id, created_at, plan_slug")
      .eq("organization_id", organization_id)
      .eq("product_type", "subscription_upgrade")
      .gte("created_at", twoMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentPreferences && recentPreferences.length > 0) {
      const recentPref = recentPreferences[0];
      console.warn('[MP create-upgrade-preference] ⚠️ Duplicate prevention: Blocking - recent preference exists:', {
        preferenceId: recentPref.id,
        createdAt: recentPref.created_at,
        planSlug: recentPref.plan_slug,
      });
      
      // Block ALL duplicate attempts within 2 minutes, regardless of payment status
      return {
        success: false,
        error: "Ya hay un proceso de pago en curso. Por favor espera 2 minutos antes de intentar nuevamente.",
        status: 429
      };
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, slug, is_active, monthly_amount, annual_amount")
      .eq("slug", plan_slug)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      console.error('[MP create-upgrade-preference] Plan not found:', planError);
      return { success: false, error: "Plan no encontrado o inactivo", status: 404 };
    }

    // adminClient already declared above for duplicate check
    const prorationResult = await calculateProration(adminClient, {
      organizationId: organization_id,
      targetPlanSlug: plan_slug,
      billingPeriod: billing_period as 'monthly' | 'annual',
    });

    console.log('[MP create-upgrade-preference] Proration calculated:', {
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

    let prorationAmountARS = prorationResult.finalPrice.ars;

    if (prorationAmountARS <= 0) {
      console.log('[MP create-upgrade-preference] Free upgrade (credit >= new price)');
      
      const shortId = `mpu_${nanoid(12)}`;
      
      const { error: insertError } = await adminClient
        .from("mp_subscription_preferences")
        .insert({
          id: shortId,
          user_id: user_id,
          organization_id,
          plan_id: plan.id,
          plan_slug,
          billing_period,
          amount_ars: "0",
          is_upgrade: true,
          previous_subscription_id: prorationResult.currentSubscription?.id || null,
          proration_credit: String(prorationResult.savings.ars),
          product_type: 'subscription_upgrade',
        });

      if (insertError) {
        console.error("[MP create-upgrade-preference] Error saving preference to DB:", insertError);
      }

      return { 
        success: true, 
        initPoint: `/api/checkout/mp/upgrade-success?preference_id=${shortId}&free=true`,
        preferenceId: shortId,
        isFreeUpgrade: true,
      };
    }

    prorationAmountARS = Math.round(prorationAmountARS);
    if (prorationAmountARS < 1) prorationAmountARS = 1;

    // Note: adminClient already declared above for duplicate check
    const userData = await getUserData(supabase, user_id);
    const payerEmail = clientPayerEmail?.trim() || userData.email;
    
    if (!payerEmail) {
      console.error('[MP create-upgrade-preference] User email not found');
      return { success: false, error: "Email del usuario no encontrado", status: 400 };
    }

    const tokenValidation = validateMPToken();
    if (!tokenValidation.valid) {
      return { success: false, error: tokenValidation.error, status: 500 };
    }

    const shortId = `mpu_${nanoid(12)}`;
    const urlContext = buildURLContext(req);

    // Note: adminClient already declared above for duplicate check
    const { error: insertError } = await adminClient
      .from("mp_subscription_preferences")
      .insert({
        id: shortId,
        user_id: user_id,
        organization_id,
        plan_id: plan.id,
        plan_slug,
        billing_period,
        amount_ars: String(prorationAmountARS),
        is_upgrade: true,
        previous_subscription_id: prorationResult.currentSubscription?.id || null,
        proration_credit: String(prorationResult.savings.ars),
        product_type: 'subscription_upgrade',
      });

    if (insertError) {
      console.error("[MP create-upgrade-preference] Error saving preference to DB:", insertError);
    } else {
      console.log("[MP create-upgrade-preference] Preference saved with short ID:", shortId);
    }

    const productTitle = `Upgrade a ${plan.name} - Pago prorrateado`;
    const productDescription = `Pago único por la diferencia al hacer upgrade a ${plan.name} (${billing_period === 'monthly' ? 'Mensual' : 'Anual'})`;

    const prefBody: any = {
      items: [
        {
          id: plan_slug,
          category_id: "subscription_upgrade",
          title: productTitle,
          description: productDescription,
          quantity: 1,
          unit_price: prorationAmountARS,
          currency_id: "ARS",
        },
      ],
      external_reference: shortId,
      payer: { 
        email: payerEmail,
        first_name: userData.firstName || "Usuario", 
        last_name: userData.lastName || "Seencel" 
      },
      notification_url: `${urlContext.webhookBase}/api/checkout/mp/webhook?secret=${MP_WEBHOOK_SECRET}`,
      back_urls: {
        success: `${urlContext.returnBase}/api/checkout/mp/upgrade-success?preference_id=${shortId}`,
        failure: `${urlContext.returnBase}/organization/billing?payment=failed`,
        pending: `${urlContext.returnBase}/organization/billing?payment=pending`,
      },
      auto_return: "approved",
      binary_mode: true,
      statement_descriptor: "SEENCEL UPGRADE",
      metadata: {
        user_id,
        product_type: 'subscription_upgrade',
        plan_slug,
        plan_id: plan.id,
        organization_id,
        billing_period,
        proration_amount_ars: prorationAmountARS,
        proration_credit_ars: prorationResult.savings.ars,
        full_price_ars: prorationResult.targetPlan.priceARS,
        previous_subscription_id: prorationResult.currentSubscription?.id,
      }
    };

    console.log('[MP create-upgrade-preference] Creating preference:', {
      plan: plan.name,
      billing_period,
      proration_amount: prorationAmountARS,
      full_price: prorationResult.targetPlan.priceARS,
      credit: prorationResult.savings.ars,
    });

    const result = await createMPPreference(prefBody);

    if (!result.success) {
      console.error("[MP create-upgrade-preference] Error de Mercado Pago:", result.body);
      return { success: false, error: result.error, status: result.status };
    }

    const { error: updateError } = await adminClient
      .from("mp_subscription_preferences")
      .update({ preference_id: result.preferenceId })
      .eq("id", shortId);
    
    if (updateError) {
      console.warn('[MP create-upgrade-preference] Failed to update preference with preference_id:', updateError);
    }

    console.log('[MP create-upgrade-preference] Preference created successfully:', {
      preferenceId: result.preferenceId,
      initPoint: result.initPoint,
      plan_slug,
      billing_period,
      prorationAmount: prorationAmountARS,
      shortId,
    });

    return { 
      success: true, 
      initPoint: result.initPoint, 
      preferenceId: result.preferenceId 
    };
  } catch (e: any) {
    console.error("[MP create-upgrade-preference] Error fatal:", e);
    return { success: false, error: e.message || String(e), status: 500 };
  }
}
