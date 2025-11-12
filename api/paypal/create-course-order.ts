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
      course_slug,
      description = "Seencel course purchase"
    } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    console.log('[PayPal create-course-order] Request received:', {
      user_id,
      course_slug
    });

    if (!user_id || !course_slug) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(400)
        .json({ ok: false, error: "Missing user_id or course_slug" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      console.error('[PayPal create-course-order] Price not found:', priceError);
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(404)
        .json({ ok: false, error: "Price not found for this course (PayPal/USD)" });
    }

    // Prefer provider-specific price, fallback to 'any'
    const chosenPrice = coursePrices.find((p: any) => p.provider === "paypal") ?? coursePrices[0];
    const amount = Number(chosenPrice.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ ok: false, error: "Invalid price" });
    }

    const productId = course.id;
    const productTitle = course.title;
    const productSlug = course.slug;
    const productDescription = course.short_description || course.title;

    console.log('[PayPal create-course-order] Course resolved with server-side pricing:', {
      course_id: course.id,
      course_title: course.title,
      amount,
      provider: chosenPrice.provider
    });

    const base = paypalBase();
    const token = await getAccessToken();

    // Use dynamic origin from request (works in Replit preview and production)
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const returnBase = `${protocol}://${host}`;

    // Generate unique invoice_id (PayPal requires uniqueness for each transaction)
    const uniqueInvoiceId = `course:${productId};user:${user_id};ts:${Date.now()}`;
    
    // Custom ID con metadata (base64) para nuestro webhook
    const customData = {
      user_id,
      product_type: 'course',
      course_slug: course_slug,
      course_id: productId,
    };
    const custom_id = Buffer.from(JSON.stringify(customData)).toString('base64');

    const return_url = `${returnBase}/api/paypal/capture-and-redirect?course_slug=${productSlug}`;
    const cancel_url = `${returnBase}/learning/courses`;

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

    console.log("[PayPal create-course-order] Creating order for:", { 
      user_id, 
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
      console.error("[PayPal create-course-order] PayPal error:", j);
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(r.status)
        .json({ ok: false, error: j });
    }

    console.log("[PayPal create-course-order] ✅ Order created:", j.id);

    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(200)
      .json({ ok: true, order: j });
  } catch (e: any) {
    console.error("[PayPal create-course-order] Fatal error:", e);
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(500)
      .json({ ok: false, error: String(e?.message || e) });
  }
}
