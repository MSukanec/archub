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
      description = "Seencel course purchase",
      code
    } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    console.log('[PayPal create-course-order] Request received:', {
      user_id,
      course_slug,
      hasCouponCode: !!code,
      couponCode: code ? code.trim() : null
    });

    if (!user_id || !course_slug) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(400)
        .json({ ok: false, error: "Missing user_id or course_slug" });
    }

    // Extract auth token from header for authenticated RPC calls
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.replace(/^Bearer\s+/i, "");
    
    if (!authToken) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(401)
        .json({ ok: false, error: "Missing authorization token" });
    }
    
    // Create authenticated client for RPC
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${authToken}` } }
    });

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
    let amount = Number(chosenPrice.amount);

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
    let couponData: any = null;

    // Validate coupon if provided
    if (code && code.trim()) {
      console.log('[PayPal create-course-order] Validating coupon:', {
        code: code.trim(),
        user_id,
        course_id: course.id,
        price: amount,
        currency: 'USD'
      });

      const { data: validationResult, error: couponError } = await supabase.rpc('validate_coupon', {
        p_code: code.trim(),
        p_course_id: course.id,
        p_price: amount,
        p_currency: 'USD'
      });

      if (couponError) {
        console.error('[PayPal create-course-order] Error validating coupon:', couponError);
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(400)
          .json({ ok: false, error: "Error validating coupon", details: couponError.message });
      }

      if (!validationResult || !validationResult.ok) {
        console.error('[PayPal create-course-order] Invalid coupon:', {
          code: code.trim(),
          reason: validationResult?.reason,
          validationResult
        });
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(400)
          .json({ 
            ok: false,
            error: "Invalid coupon", 
            reason: validationResult?.reason || 'UNKNOWN'
          });
      }

      // Valid coupon - apply discount
      couponData = validationResult;
      const finalPrice = Number(validationResult.final_price);
      
      // If coupon gives 100% discount, return special response for free enrollment
      if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
        console.log('[PayPal create-course-order] 100% discount coupon - free enrollment:', {
          code: code.trim(),
          coupon_id: validationResult.coupon_id
        });
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(200)
          .json({ 
            ok: true,
            free_enrollment: true,
            coupon_code: code.trim(),
            coupon_id: validationResult.coupon_id
          });
      }
      
      amount = finalPrice;
      console.log('[PayPal create-course-order] Coupon applied:', {
        code: code.trim(),
        discount: validationResult.discount,
        final_price: amount
      });
    }

    console.log('[PayPal create-course-order] Course resolved with server-side pricing:', {
      course_id: course.id,
      course_title: course.title,
      amount,
      provider: chosenPrice.provider,
      hasCoupon: !!couponData,
      couponCode: couponData ? code.trim() : null
    });

    const base = paypalBase();
    const token = await getAccessToken();

    // Use dynamic origin from request (works in Replit preview and production)
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const returnBase = `${protocol}://${host}`;

    // Generate unique invoice_id (PayPal max 127 chars)
    // Use shortened UUIDs (first 8 chars) for logging/debug only
    const shortCourseId = productId.substring(0, 8);
    const shortUserId = user_id.substring(0, 8);
    const timestamp = Date.now();
    
    // Format: c:UUID;u:UUID;ts:TIMESTAMP (~42 chars without coupon)
    const uniqueInvoiceId = couponData 
      ? `c:${shortCourseId};u:${shortUserId};cpn:${code.trim().substring(0, 8)};ts:${timestamp}`
      : `c:${shortCourseId};u:${shortUserId};ts:${timestamp}`;
    
    // Custom ID with FULL UUIDs in pipe-delimited format (PayPal max 127 chars)
    // Format without coupon: user_id|course_id (~73 chars)
    // Format with coupon: user_id|course_id|coupon_code|coupon_id (~120 chars max)
    const custom_id = couponData
      ? `${user_id}|${productId}|${code.trim().toUpperCase()}|${couponData.coupon_id}`
      : `${user_id}|${productId}`;

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
