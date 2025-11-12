import type { VercelRequest, VercelResponse } from "@vercel/node";
import { corsHeaders, paypalBase, getAccessToken } from "./_utils";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"])
      .setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"])
      .status(200)
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
      amount_usd,
      description = "Seencel subscription"
    } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    console.log('[PayPal create-subscription-order] Request received:', {
      user_id,
      plan_slug,
      organization_id,
      billing_period,
      amount_usd
    });

    // Validar parámetros requeridos
    if (!user_id) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(400)
        .json({ ok: false, error: "Missing user_id" });
    }

    if (!plan_slug || !organization_id || !billing_period) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(400)
        .json({ ok: false, error: "Missing plan_slug, organization_id or billing_period" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // CRÍTICO: Verificar que el usuario pertenece a la organización y es admin
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("id, role_id, roles!inner(name)")
      .eq("organization_id", organization_id)
      .eq("user_id", user_id)
      .eq("is_active", true)
      .single();

    if (memberError || !membership) {
      console.error('[PayPal create-subscription-order] User not member of organization:', memberError);
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(403)
        .json({ ok: false, error: "You don't have permissions to modify this organization" });
    }

    // Verificar que es admin o administrador
    const roleName = (membership.roles as any)?.name?.toLowerCase();
    if (roleName !== 'admin' && roleName !== 'owner' && roleName !== 'administrador') {
      console.error('[PayPal create-subscription-order] User is not admin:', { roleName });
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(403)
        .json({ ok: false, error: "Only administrators can upgrade the organization plan" });
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
        .json({ ok: false, error: "Plan not found or inactive" });
    }

    // Obtener precio del plan para PayPal en USD
    const { data: planPrices, error: priceError } = await supabase
      .from("plan_prices")
      .select("monthly_amount, annual_amount, currency_code, provider")
      .eq("plan_id", plan.id)
      .eq("currency_code", "USD")
      .in("provider", ["paypal", "any"])
      .eq("is_active", true);

    if (priceError || !planPrices || planPrices.length === 0) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(404)
        .json({ ok: false, error: "Price not found for this plan (PayPal/USD)" });
    }

    const chosenPrice = planPrices.find((p: any) => p.provider === "paypal") ?? planPrices[0];
    const priceAmount = billing_period === 'monthly' ? chosenPrice.monthly_amount : chosenPrice.annual_amount;

    const amount = Number(priceAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ ok: false, error: "Invalid price" });
    }

    const productId = plan.id;
    const productTitle = `Plan ${plan.name} - ${billing_period === 'monthly' ? 'Monthly' : 'Annual'}`;
    const productSlug = plan_slug;
    const productDescription = `${billing_period === 'monthly' ? 'Monthly' : 'Annual'} subscription to ${plan.name} plan`;

    console.log('[PayPal create-subscription-order] Subscription order:', {
      plan_id: plan.id,
      plan_name: plan.name,
      billing_period,
      amount,
      organization_id
    });

    const base = paypalBase();
    const token = await getAccessToken();

    // Use dynamic origin from request (works in Replit preview and production)
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const returnBase = `${protocol}://${host}`;

    // Generate unique invoice_id (PayPal max 127 chars)
    // Use shortened UUIDs (first 8 chars) for logging/debug only
    const shortPlanId = productId.substring(0, 8);
    const shortUserId = user_id.substring(0, 8);
    const shortOrgId = organization_id.substring(0, 8);
    const timestamp = Date.now();
    
    // Format: sub:UUID;u:UUID;o:UUID;bp:VALUE;ts:TIMESTAMP (~62 chars)
    const uniqueInvoiceId = `sub:${shortPlanId};u:${shortUserId};o:${shortOrgId};bp:${billing_period};ts:${timestamp}`;
    
    // Custom ID with FULL UUIDs in pipe-delimited format (PayPal max 127 chars)
    // Format: user_id|plan_id|organization_id|billing_period (~118 chars)
    const custom_id = `${user_id}|${productId}|${organization_id}|${billing_period}`;

    const return_url = `${returnBase}/api/paypal/capture-subscription`;
    const cancel_url = `${returnBase}/organization/billing?payment=cancelled`;

    const body = {
      intent: "CAPTURE",
      purchase_units: [{
        amount: { 
          currency_code: "USD", 
          value: String(amount) 
        },
        description: productDescription,
        invoice_id: uniqueInvoiceId,
        custom_id: custom_id,
      }],
      application_context: {
        brand_name: "Seencel",
        user_action: "PAY_NOW",
        return_url,
        cancel_url,
      }
    };

    console.log("[PayPal create-subscription-order] Creating order for:", { 
      user_id, 
      productSlug,
      amount,
      organization_id,
      billing_period,
      return_url,
      cancel_url
    });

    const r = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(body)
    });

    const j = await r.json();
    
    if (!r.ok) {
      console.error("[PayPal create-subscription-order] PayPal error:", j);
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(r.status)
        .json({ ok: false, error: j });
    }

    console.log("[PayPal create-subscription-order] ✅ Order created:", j.id);

    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(200)
      .json({ ok: true, order: j });
  } catch (e: any) {
    console.error("[PayPal create-subscription-order] Fatal error:", e);
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(500)
      .json({ ok: false, error: String(e?.message || e) });
  }
}
