import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Detectar modo test/producción
const MP_MODE = process.env.MP_MODE || "production";
const isTestMode = MP_MODE === "test";

// Usar credenciales según el modo
const MP_ACCESS_TOKEN = isTestMode 
  ? process.env.MP_ACCESS_TOKEN_TEST! 
  : process.env.MP_ACCESS_TOKEN!;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || "";

console.log(`[MP create-subscription-preference] Modo: ${isTestMode ? '🧪 TEST' : '💰 PRODUCCIÓN'}`);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return res
      .status(200)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"])
      .setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"])
      .send("ok");
  }

  if (req.method !== "POST") {
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { 
      user_id, 
      plan_slug,
      organization_id,
      billing_period,
      currency = "ARS"
    } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    console.log('[MP create-subscription-preference] Request received:', {
      user_id,
      plan_slug,
      organization_id,
      billing_period,
      currency
    });

    if (!user_id || !plan_slug || !organization_id || !billing_period) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(400)
        .json({ ok: false, error: "Falta user_id, plan_slug, organization_id o billing_period" });
    }

    // Extract auth token from header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    
    if (!token) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(401)
        .json({ ok: false, error: "Missing authorization token" });
    }
    
    // Create authenticated client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // CRÍTICO: Verificar que el usuario pertenece a la organización y es admin
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("id, role_id, roles!inner(name)")
      .eq("organization_id", organization_id)
      .eq("user_id", user_id)
      .eq("is_active", true)
      .single();

    if (memberError || !membership) {
      console.error('[MP create-subscription-preference] User not member of organization:', memberError);
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(403)
        .json({ ok: false, error: "No tienes permisos para modificar esta organización" });
    }

    // Verificar que es admin
    const roleName = (membership.roles as any)?.name?.toLowerCase();
    const validAdminRoles = ['admin', 'owner', 'administrador'];
    if (!validAdminRoles.includes(roleName)) {
      console.error('[MP create-subscription-preference] User is not admin:', { roleName });
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(403)
        .json({ ok: false, error: "Solo los administradores pueden upgradear el plan de la organización" });
    }

    // Obtener plan
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, slug, is_active")
      .eq("slug", plan_slug)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(404)
        .json({ ok: false, error: "Plan no encontrado o inactivo" });
    }

    // SECURITY: Get price from plan_prices table (same as PayPal endpoint)
    const { data: planPrices, error: priceError } = await supabase
      .from("plan_prices")
      .select("monthly_amount, annual_amount, currency_code, provider")
      .eq("plan_id", plan.id)
      .eq("currency_code", currency)
      .in("provider", ["mercadopago", "any"])
      .eq("is_active", true);

    if (priceError || !planPrices || planPrices.length === 0) {
      console.error('[MP create-subscription-preference] Price not found:', priceError);
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(404)
        .json({ ok: false, error: `Precio no encontrado para este plan (MercadoPago/${currency})` });
    }

    // Prefer provider-specific price, fallback to 'any'
    const chosenPrice = planPrices.find((p: any) => p.provider === "mercadopago") ?? planPrices[0];
    const priceAmount = billing_period === 'monthly' ? chosenPrice.monthly_amount : chosenPrice.annual_amount;

    const unit_price = Number(priceAmount);
    if (!Number.isFinite(unit_price) || unit_price <= 0) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ ok: false, error: "Precio inválido en plan_prices" });
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

    // Obtener datos del usuario
    const { data: userRow } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user_id)
      .maybeSingle();

    const email = userRow?.email;
    const fullNameParts = userRow?.full_name?.trim().split(" ") ?? [];
    const first_name = fullNameParts[0] || "Usuario";
    const last_name = fullNameParts.length > 1 
      ? fullNameParts.slice(1).join(" ") 
      : "Seencel";

    // Validar token
    const isValidToken = MP_ACCESS_TOKEN && 
      (MP_ACCESS_TOKEN.startsWith("APP_USR-") || MP_ACCESS_TOKEN.startsWith("TEST-"));
    
    if (!isValidToken) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ ok: false, error: "MP_ACCESS_TOKEN no configurado correctamente" });
    }

    // Construir customData
    const customData = {
      user_id,
      product_type: 'subscription',
      plan_slug,
      organization_id,
      billing_period,
    };

    const custom_id = Buffer.from(JSON.stringify(customData)).toString('base64');

    // Construir URLs
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const requestOrigin = `${protocol}://${host}`;
    const returnBase = requestOrigin;
    const webhookBase = process.env.CHECKOUT_RETURN_URL_BASE || requestOrigin;
    
    const backUrls = {
      success: `${returnBase}/organization/billing?payment=success`,
      failure: `${returnBase}/organization/billing?payment=failed`,
      pending: `${returnBase}/organization/billing?payment=pending`,
    };

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
        email, 
        first_name, 
        last_name 
      },
      notification_url: `${webhookBase}/api/mp/webhook?secret=${MP_WEBHOOK_SECRET}`,
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

    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prefBody),
    });

    const responseText = await r.text();
    let pref: any;
    try {
      pref = JSON.parse(responseText);
    } catch {
      pref = { raw: responseText };
    }

    if (!r.ok || !pref?.init_point) {
      console.error("[MP create-subscription-preference] Error de Mercado Pago:", pref);
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(r.status)
        .json({ ok: false, error: "Error al crear preferencia en Mercado Pago", body: pref });
    }

    console.log("[MP create-subscription-preference] ✅ Preferencia creada:", pref.id);

    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(200)
      .json({ ok: true, init_point: pref.init_point, preference_id: pref.id });
  } catch (e: any) {
    console.error("[MP create-subscription-preference] Error fatal:", e);
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(500)
      .json({ ok: false, error: e.message || String(e) });
  }
}
