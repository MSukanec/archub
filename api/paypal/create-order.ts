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
      product_type = 'course',
      course_slug,
      plan_slug,
      organization_id,
      billing_period,
      description = "Seencel purchase"
    } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    console.log('[PayPal create-order] Request received:', {
      user_id,
      product_type,
      course_slug,
      plan_slug,
      organization_id,
      billing_period
    });

    // Validar parámetros según tipo de producto
    if (!user_id) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(400)
        .json({ ok: false, error: "Missing user_id" });
    }

    if (product_type === 'subscription') {
      if (!plan_slug || !organization_id || !billing_period) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(400)
          .json({ ok: false, error: "For subscriptions, plan_slug, organization_id and billing_period are required" });
      }
    } else {
      if (!course_slug) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(400)
          .json({ ok: false, error: "For courses, course_slug is required" });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let productId: string;
    let productTitle: string;
    let productSlug: string;
    let productDescription: string;
    let amount: number;

    // ==================== FLUJO PARA SUSCRIPCIONES ====================
    if (product_type === 'subscription') {
      console.log('[PayPal create-order] Processing subscription...');

      // CRÍTICO: Verificar que el usuario pertenece a la organización y es admin
      const { data: membership, error: memberError } = await supabase
        .from("organization_members")
        .select("id, role_id, roles!inner(name)")
        .eq("organization_id", organization_id)
        .eq("user_id", user_id)
        .eq("is_active", true)
        .single();

      if (memberError || !membership) {
        console.error('[PayPal create-order] User not member of organization:', memberError);
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(403)
          .json({ ok: false, error: "You don't have permissions to modify this organization" });
      }

      // Verificar que es admin
      const roleName = (membership.roles as any)?.name?.toLowerCase();
      if (roleName !== 'admin' && roleName !== 'owner') {
        console.error('[PayPal create-order] User is not admin:', { roleName });
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

      amount = Number(priceAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(500)
          .json({ ok: false, error: "Invalid price" });
      }

      productId = plan.id;
      productTitle = `Plan ${plan.name} - ${billing_period === 'monthly' ? 'Monthly' : 'Annual'}`;
      productSlug = plan_slug;
      productDescription = `${billing_period === 'monthly' ? 'Monthly' : 'Annual'} subscription to ${plan.name} plan`;

      // NO hay cupones para suscripciones en el MVP
      console.log('[PayPal create-order] Subscription order:', {
        plan_id: plan.id,
        plan_name: plan.name,
        billing_period,
        amount,
        organization_id
      });

    // ==================== FLUJO PARA CURSOS ====================
    } else {
      console.log('[PayPal create-order] Processing course...');

      // Resolve course_id from course_slug
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, title, slug, short_description')
        .eq('slug', course_slug)
        .single();

      if (courseError || !course) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(404)
          .json({ ok: false, error: "Course not found" });
      }

      // SECURITY: Get price from database (course_prices table), NOT from client
      const { data: coursePrices, error: priceError } = await supabase
        .from("course_prices")
        .select("amount, currency_code, provider")
        .eq("course_id", course.id)
        .eq("currency_code", "USD")
        .in("provider", ["paypal", "any"])
        .eq("is_active", true);

      if (priceError || !coursePrices || coursePrices.length === 0) {
        console.error('[PayPal create-order] Price not found:', priceError);
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(404)
          .json({ ok: false, error: "Price not found for this course (PayPal/USD)" });
      }

      // Prefer provider-specific price, fallback to 'any'
      const chosenPrice = coursePrices.find((p: any) => p.provider === "paypal") ?? coursePrices[0];
      amount = Number(chosenPrice.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(500)
          .json({ ok: false, error: "Invalid price" });
      }

      productId = course.id;
      productTitle = course.title;
      productSlug = course.slug;
      productDescription = course.short_description || course.title;

      console.log('[PayPal create-order] Course order with server-side pricing:', {
        course_id: course.id,
        course_title: course.title,
        amount,
        provider: chosenPrice.provider
      });
    }

    const base = paypalBase();
    const token = await getAccessToken();

    // Use dynamic origin from request (works in Replit preview and production)
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const returnBase = `${protocol}://${host}`;

    // Construir customData según tipo de producto (para metadata)
    const customData: any = {
      user_id,
      product_type,
    };

    if (product_type === 'subscription') {
      customData.plan_slug = plan_slug;
      customData.plan_id = productId;
      customData.organization_id = organization_id;
      customData.billing_period = billing_period;
    } else {
      customData.course_slug = course_slug;
      customData.course_id = productId;
    }

    // Generate unique invoice_id (PayPal requires uniqueness for each transaction)
    const uniqueInvoiceId = `${product_type}:${productId};user:${user_id};ts:${Date.now()}`;
    
    // Custom ID con metadata (base64) para nuestro webhook
    const custom_id = Buffer.from(JSON.stringify(customData)).toString('base64');

    // Construir return y cancel URLs según tipo de producto
    let return_url: string;
    let cancel_url: string;

    if (product_type === 'subscription') {
      return_url = `${returnBase}/organization/billing?payment=success`;
      cancel_url = `${returnBase}/organization/billing?payment=cancelled`;
    } else {
      return_url = `${returnBase}/api/paypal/capture-and-redirect?course_slug=${productSlug}`;
      cancel_url = `${returnBase}/learning/courses`;
    }

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

    console.log("[PayPal create-order] Creating order for:", { 
      user_id, 
      product_type,
      productSlug,
      amount,
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
      console.error("[PayPal create-order] PayPal error:", j);
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(r.status)
        .json({ ok: false, error: j });
    }

    console.log("[PayPal create-order] ✅ Order created:", j.id);

    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(200)
      .json({ ok: true, order: j });
  } catch (e: any) {
    console.error("[PayPal create-order] Fatal error:", e);
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(500)
      .json({ ok: false, error: String(e?.message || e) });
  }
}
