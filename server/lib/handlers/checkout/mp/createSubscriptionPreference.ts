import type { Request } from "express";
import { getAuthenticatedClient } from "../shared/auth.js";
import { verifyAdminRoleForOrganization } from "../shared/permissions.js";
import { getPlanPrice } from "../shared/pricing.js";
import { getUserData } from "../shared/user.js";
import { buildURLContext, buildSubscriptionBackUrls } from "../shared/urls.js";
import { validateMPToken, logMPMode, MP_WEBHOOK_SECRET, isTestMode } from "./config.js";
import { encodeCustomData } from "./encoding.js";
import { createMPPreference } from "./api.js";
import { calculateProration } from "../shared/proration.js";
import { getAdminClient } from "../../../../routes/_base.js";

export type CreateSubscriptionPreferenceResult =
  | { success: true; initPoint: string; preferenceId: string }
  | { success: false; error: string; status?: number };

export async function createSubscriptionPreference(req: Request): Promise<CreateSubscriptionPreferenceResult> {
  logMPMode("create-subscription-preference");

  // 1. Parse body
  const { 
    plan_slug,
    organization_id,
    billing_period,
    currency = "ARS",
    is_upgrade,
    proration_amount_ars,
    proration_credit_ars
  } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  // 2. Validate inputs
  if (!plan_slug || !organization_id || !billing_period) {
    return { 
      success: false, 
      error: "Falta plan_slug, organization_id o billing_period", 
      status: 400 
    };
  }

  // 3. Get authenticated client
  const authResult = getAuthenticatedClient(req);
  if (!authResult.success) {
    return { success: false, error: authResult.error, status: 401 };
  }

  const { supabase } = authResult;

  // 4. SECURITY: Derive user_id from authenticated session, NOT from request body
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('[MP create-subscription-preference] Auth error:', userError);
    return { success: false, error: "Authentication failed", status: 401 };
  }

  // Look up actual user ID from auth_id in users table (same pattern as PayPal)
  const { data: userRecord, error: userLookupError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  
  if (userLookupError || !userRecord) {
    console.error("[MP create-subscription-preference] User lookup failed:", userLookupError);
    return { success: false, error: "Usuario no encontrado", status: 404 };
  }

  const user_id = userRecord.id;
  const auth_id = user.id;

  try {
    // 5. CRÍTICO: Verificar que el usuario pertenece a la organización y es admin
    // verifyAdminRoleForOrganization expects auth_id
    const adminCheck = await verifyAdminRoleForOrganization(supabase, auth_id, organization_id);
    
    if (!adminCheck.success) {
      return { 
        success: false, 
        error: adminCheck.error, 
        status: 403 
      };
    }

    // 6. Obtener plan con precios en USD
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, slug, is_active, monthly_amount, annual_amount")
      .eq("slug", plan_slug)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return { success: false, error: "Plan no encontrado o inactivo", status: 404 };
    }

    // 6.5. VALIDACIÓN: Prevenir suscripciones duplicadas (excepto para upgrades)
    try {
      const { data: existingSubscription, error: subCheckError } = await supabase
        .from("organization_subscriptions")
        .select("id, status, expires_at, plan_id")
        .eq("organization_id", organization_id)
        .eq("plan_id", plan.id)
        .in("status", ["active", "trialing", "pending", "cancelled"])
        .order("started_at", { ascending: false })
        .maybeSingle();

      if (subCheckError) {
        console.error('[MP create-subscription-preference] Error checking existing subscription:', subCheckError);
        return { success: false, error: "Error verificando suscripciones existentes", status: 500 };
      }

      if (existingSubscription) {
        const expiresAt = existingSubscription.expires_at ? new Date(existingSubscription.expires_at) : null;
        const isStillActive = !expiresAt || expiresAt > new Date();

        if (isStillActive) {
          return { 
            success: false, 
            error: "Ya tienes una suscripción activa a este plan", 
            status: 400 
          };
        }
      }
    } catch (error) {
      console.error('[MP create-subscription-preference] Unexpected error checking subscriptions:', error);
      return { success: false, error: "Error inesperado verificando suscripciones", status: 500 };
    }

    // Si es un upgrade, obtener la suscripción actual para metadata
    let currentSubscriptionId: string | null = null;
    if (is_upgrade) {
      const { data: currentSub } = await supabase
        .from("organization_subscriptions")
        .select("id")
        .eq("organization_id", organization_id)
        .in("status", ["active", "trialing"])
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (currentSub) {
        currentSubscriptionId = currentSub.id;
      }
    }

    // 7. SECURITY: Get price from plans table (USD base) and convert if needed
    const priceAmount = billing_period === 'monthly' ? plan.monthly_amount : plan.annual_amount;
    let basePrice = Number(priceAmount);

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      console.error('[MP create-subscription-preference] Invalid price:', {
        plan_slug,
        billing_period,
        monthly_amount: plan.monthly_amount,
        annual_amount: plan.annual_amount
      });
      return { success: false, error: "Precio inválido", status: 500 };
    }

    // 7.5. Para el primer pago de TEAMS, SIEMPRE cobrar 1 seat
    // Los snapshots en billing_cycles guardarán el conteo real para renovaciones futuras
    const seats = 1; // Primer pago siempre es solo por el admin
    let unit_price = basePrice * seats;

    // Si la moneda es ARS, convertir usando exchange_rates
    if (currency === 'ARS') {
      const { data: exchangeRate, error: exchangeError } = await supabase
        .from("exchange_rates")
        .select("rate")
        .eq("from_currency", "USD")
        .eq("to_currency", "ARS")
        .eq("is_active", true)
        .single();

      if (exchangeError || !exchangeRate) {
        console.error('[MP create-subscription-preference] Exchange rate not found:', exchangeError);
        return { success: false, error: "Tasa de cambio no disponible", status: 500 };
      }

      unit_price = unit_price * Number(exchangeRate.rate);
    }

    // 7.6. SECURITY: If upgrade requested, recalculate proration server-side (never trust client values)
    let serverProrationCredit = 0;
    if (is_upgrade && currency === 'ARS') {
      try {
        const adminClient = getAdminClient();
        const prorationResult = await calculateProration(adminClient, {
          organizationId: organization_id,
          targetPlanSlug: plan_slug,
          billingPeriod: billing_period as 'monthly' | 'annual',
        });

        if (prorationResult.hasActiveSubscription && prorationResult.savings.ars > 0) {
          const serverProrationPrice = prorationResult.finalPrice.ars;
          serverProrationCredit = prorationResult.savings.ars;
          
          console.log('[MP create-subscription-preference] Server-calculated proration:', {
            original_price: unit_price,
            server_prorated_price: serverProrationPrice,
            server_credit: serverProrationCredit,
            client_prorated_price: proration_amount_ars,
            client_credit: proration_credit_ars,
          });

          // Use server-calculated price, not client-provided
          unit_price = serverProrationPrice;
        } else {
          console.log('[MP create-subscription-preference] No active subscription for proration, using full price');
        }
      } catch (prorationError) {
        console.error('[MP create-subscription-preference] Proration calculation error:', prorationError);
        // Continue with full price if proration fails
      }
    }

    const productId = plan.id;
    const productTitle = is_upgrade 
      ? `Upgrade a ${plan.name} - ${billing_period === 'monthly' ? 'Mensual' : 'Anual'}`
      : `Plan ${plan.name} - ${billing_period === 'monthly' ? 'Mensual' : 'Anual'}`;
    const productSlug = plan_slug;
    const productDescription = is_upgrade
      ? `Upgrade de suscripción ${billing_period === 'monthly' ? 'mensual' : 'anual'} al plan ${plan.name}`
      : `Suscripción ${billing_period === 'monthly' ? 'mensual' : 'anual'} al plan ${plan.name}`;

    // 8. Obtener datos del usuario
    const userData = await getUserData(supabase, user_id);

    // 9. Validar token
    const tokenValidation = validateMPToken();
    if (!tokenValidation.valid) {
      return { success: false, error: tokenValidation.error, status: 500 };
    }

    // 10. Construir customData
    const customData: Record<string, any> = {
      user_id,
      product_type: 'subscription',
      plan_slug,
      organization_id,
      billing_period,
    };

    // Incluir datos de upgrade si es un upgrade (use server-calculated credit)
    if (is_upgrade) {
      customData.is_upgrade = true;
      if (currentSubscriptionId) {
        customData.previous_subscription_id = currentSubscriptionId;
      }
      if (serverProrationCredit > 0) {
        customData.proration_credit = serverProrationCredit;
      }
    }

    const custom_id = encodeCustomData(customData);

    // 11. Construir URLs
    const urlContext = buildURLContext(req);
    const backUrls = buildSubscriptionBackUrls(urlContext.returnBase);

    const prefBody = {
      items: [
        {
          id: productSlug,
          category_id: "services",
          title: productTitle,
          description: productDescription,
          quantity: 1,
          unit_price,
          currency_id: currency,
        },
      ],
      external_reference: custom_id,
      payer: { 
        email: userData.email,
        first_name: userData.firstName || "Comprador", 
        last_name: userData.lastName || "Plan" 
      },
      notification_url: `${urlContext.webhookBase}/api/checkout/mp/webhook?secret=${MP_WEBHOOK_SECRET}`,
      back_urls: backUrls,
      auto_return: "approved",
      binary_mode: true,
      statement_descriptor: "SEENCEL",
      metadata: {
        user_id,
        product_type: 'subscription',
        plan_slug,
        organization_id,
        billing_period,
        ...(is_upgrade && {
          is_upgrade: true,
          previous_subscription_id: currentSubscriptionId,
          proration_credit: serverProrationCredit > 0 ? serverProrationCredit : undefined,
        }),
      }
    };

    // 12. Create MP preference
    const result = await createMPPreference(prefBody);

    if (!result.success) {
      console.error("[MP create-subscription-preference] Error de Mercado Pago:", result.body);
      return { success: false, error: result.error, status: result.status };
    }

    return { 
      success: true, 
      initPoint: result.initPoint, 
      preferenceId: result.preferenceId 
    };
  } catch (e: any) {
    console.error("[MP create-subscription-preference] Error fatal:", e);
    return { success: false, error: e.message || String(e), status: 500 };
  }
}
