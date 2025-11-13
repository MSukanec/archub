import type { VercelRequest } from "@vercel/node";
import { getAuthenticatedClient } from "../shared/auth";
import { verifyAdminRoleForOrganization } from "../shared/permissions";
import { getPlanPrice } from "../shared/pricing";
import { getUserData } from "../shared/user";
import { buildURLContext, buildSubscriptionBackUrls } from "../shared/urls";
import { validateMPToken, logMPMode, MP_WEBHOOK_SECRET } from "./config";
import { encodeCustomData } from "./encoding";
import { createMPPreference } from "./api";

export type CreateSubscriptionPreferenceResult =
  | { success: true; initPoint: string; preferenceId: string }
  | { success: false; error: string; status?: number };

export async function createSubscriptionPreference(req: VercelRequest): Promise<CreateSubscriptionPreferenceResult> {
  logMPMode("create-subscription-preference");

  // 1. Parse body
  const { 
    plan_slug,
    organization_id,
    billing_period,
    currency = "ARS"
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

  const user_id = user.id;

  console.log('[MP create-subscription-preference] Request received:', {
    user_id,
    plan_slug,
    organization_id,
    billing_period,
    currency
  });

  try {
    // 5. CRÍTICO: Verificar que el usuario pertenece a la organización y es admin
    const adminCheck = await verifyAdminRoleForOrganization(supabase, user_id, organization_id);
    
    if (!adminCheck.success) {
      return { 
        success: false, 
        error: adminCheck.error, 
        status: 403 
      };
    }

    // 6. Obtener plan
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, slug, is_active")
      .eq("slug", plan_slug)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return { success: false, error: "Plan no encontrado o inactivo", status: 404 };
    }

    // 7. SECURITY: Get price from plan_prices table (same as PayPal endpoint)
    const { data: planPrices, error: priceError } = await supabase
      .from("plan_prices")
      .select("monthly_amount, annual_amount, currency_code, provider")
      .eq("plan_id", plan.id)
      .eq("currency_code", currency)
      .in("provider", ["mercadopago", "any"])
      .eq("is_active", true);

    if (priceError || !planPrices || planPrices.length === 0) {
      console.error('[MP create-subscription-preference] Price not found:', priceError);
      return { 
        success: false, 
        error: `Precio no encontrado para este plan (MercadoPago/${currency})`, 
        status: 404 
      };
    }

    // Prefer provider-specific price, fallback to 'any'
    const chosenPrice = planPrices.find((p: any) => p.provider === "mercadopago") ?? planPrices[0];
    const priceAmount = billing_period === 'monthly' ? chosenPrice.monthly_amount : chosenPrice.annual_amount;

    const unit_price = Number(priceAmount);
    if (!Number.isFinite(unit_price) || unit_price <= 0) {
      return { success: false, error: "Precio inválido en plan_prices", status: 500 };
    }

    console.log('[MP create-subscription-preference] Price from plan_prices:', {
      plan_id: plan.id,
      billing_period,
      currency,
      unit_price,
      provider: chosenPrice.provider
    });

    const productId = plan.id;
    const productTitle = `Plan ${plan.name} - ${billing_period === 'monthly' ? 'Mensual' : 'Anual'}`;
    const productSlug = plan_slug;
    const productDescription = `Suscripción ${billing_period === 'monthly' ? 'mensual' : 'anual'} al plan ${plan.name}`;

    // 8. Obtener datos del usuario
    const userData = await getUserData(supabase, user_id);

    // 9. Validar token
    const tokenValidation = validateMPToken();
    if (!tokenValidation.valid) {
      return { success: false, error: tokenValidation.error, status: 500 };
    }

    // 10. Construir customData
    const customData = {
      user_id,
      product_type: 'subscription',
      plan_slug,
      organization_id,
      billing_period,
    };

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
        first_name: userData.firstName, 
        last_name: userData.lastName 
      },
      notification_url: `${urlContext.webhookBase}/api/mp/webhook?secret=${MP_WEBHOOK_SECRET}`,
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
      }
    };

    console.log("[MP create-subscription-preference] Creando preferencia para:", { 
      user_id, 
      productSlug,
      unit_price, 
      currency,
      organization_id,
      billing_period
    });

    // 12. Create MP preference
    const result = await createMPPreference(prefBody);

    if (!result.success) {
      console.error("[MP create-subscription-preference] Error de Mercado Pago:", result.body);
      return { success: false, error: result.error, status: result.status };
    }

    console.log("[MP create-subscription-preference] ✅ Preferencia creada:", result.preferenceId);

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
