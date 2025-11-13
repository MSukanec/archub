import type { VercelRequest } from "@vercel/node";
import { getAuthenticatedClient } from "../shared/auth.js";
import { validateAndApplyCoupon } from "../shared/coupons.js";
import { getUserData } from "../shared/user.js";
import { buildURLContext, buildCourseBackUrls } from "../shared/urls.js";
import { logPayPalMode } from "./config.js";
import { encodeInvoiceId, encodeCustomId } from "./encoding.js";
import { createPayPalOrder } from "./api.js";

export type CreateCourseOrderResult =
  | { success: true; orderId: string; approvalUrl: string; order: any }
  | { success: true; freeEnrollment: true; couponCode: string; couponId: string }
  | { success: false; error: string; status?: number; details?: any };

export async function createCourseOrder(
  req: VercelRequest
): Promise<CreateCourseOrderResult> {
  try {
    const {
      course_slug,
      description = "Seencel course purchase",
      code,
    } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!course_slug) {
      return {
        success: false,
        error: "Missing course_slug",
        status: 400,
      };
    }

    // Extract auth token and create authenticated client
    const authResult = getAuthenticatedClient(req);
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
        status: 401,
      };
    }

    const { supabase } = authResult;

    // SECURITY: Derive user_id from authenticated session, NOT from request body
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[PayPal create-course-order] Auth error:", userError);
      return {
        success: false,
        error: "Authentication failed",
        status: 401,
      };
    }

    const user_id = user.id;

    console.log("[PayPal create-course-order] Request received:", {
      user_id,
      course_slug,
      hasCouponCode: !!code,
      couponCode: code ? code.trim() : null,
    });

    // Resolve course_id from course_slug and get price in USD
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, slug, short_description, price")
      .eq("slug", course_slug)
      .single();

    if (courseError || !course) {
      return {
        success: false,
        error: "Course not found",
        status: 404,
      };
    }

    // SECURITY: Get price from database (courses.price in USD), NOT from client
    let amount = Number(course.price);

    if (!Number.isFinite(amount) || amount <= 0) {
      console.error(
        "[PayPal create-course-order] Invalid price:",
        course.price
      );
      return {
        success: false,
        error: "Invalid price for this course",
        status: 500,
      };
    }

    const productId = course.id;
    const productTitle = course.title;
    const productSlug = course.slug;
    const productDescription = course.short_description || course.title;
    let couponData: any = null;

    // Validate coupon if provided
    if (code && code.trim()) {
      console.log("[PayPal create-course-order] Validating coupon:", {
        code: code.trim(),
        user_id,
        course_id: course.id,
        price: amount,
        currency: "USD",
      });

      const { data: validationResult, error: couponError } = await supabase.rpc(
        "validate_coupon",
        {
          p_code: code.trim(),
          p_course_id: course.id,
          p_price: amount,
          p_currency: "USD",
        }
      );

      if (couponError) {
        console.error(
          "[PayPal create-course-order] Error validating coupon:",
          couponError
        );
        return {
          success: false,
          error: "Error validating coupon",
          status: 400,
          details: couponError.message,
        };
      }

      if (!validationResult || !validationResult.ok) {
        console.error("[PayPal create-course-order] Invalid coupon:", {
          code: code.trim(),
          reason: validationResult?.reason,
          validationResult,
        });
        return {
          success: false,
          error: "Invalid coupon",
          status: 400,
          details: validationResult?.reason || "UNKNOWN",
        };
      }

      // Valid coupon - apply discount
      couponData = validationResult;
      const finalPrice = Number(validationResult.final_price);

      // If coupon gives 100% discount, return special response for free enrollment
      if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
        console.log(
          "[PayPal create-course-order] 100% discount coupon - free enrollment:",
          {
            code: code.trim(),
            coupon_id: validationResult.coupon_id,
          }
        );
        return {
          success: true,
          freeEnrollment: true,
          couponCode: code.trim(),
          couponId: validationResult.coupon_id,
        };
      }

      amount = finalPrice;
      console.log("[PayPal create-course-order] Coupon applied:", {
        code: code.trim(),
        discount: validationResult.discount,
        final_price: amount,
      });
    }

    console.log(
      "[PayPal create-course-order] Course resolved with server-side pricing:",
      {
        course_id: course.id,
        course_title: course.title,
        amount,
        currency: "USD",
        hasCoupon: !!couponData,
        couponCode: couponData ? code.trim() : null,
      }
    );

    logPayPalMode("create-course-order");

    // Build URLs
    const { returnBase } = buildURLContext(req);
    const { success: successUrl } = buildCourseBackUrls(
      returnBase,
      productSlug,
      "paypal"
    );

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

    const return_url = `${returnBase}/api/checkout/paypal/capture-and-redirect?course_slug=${productSlug}`;
    const cancel_url = `${returnBase}/learning/courses`;

    const orderBody = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: String(amount),
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

    console.log("[PayPal create-course-order] Creating order for:", {
      user_id,
      productSlug,
      amount,
      return_url,
      cancel_url,
    });

    const result = await createPayPalOrder(orderBody);

    if (!result.success) {
      console.error("[PayPal create-course-order] PayPal error:", result.body);
      return {
        success: false,
        error: result.error,
        status: result.status,
        details: result.body,
      };
    }

    console.log("[PayPal create-course-order] ✅ Order created:", result.orderId);

    return {
      success: true,
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
      order: { id: result.orderId, links: [{ rel: "approve", href: result.approvalUrl }] },
    };
  } catch (e: any) {
    console.error("[PayPal create-course-order] Fatal error:", e);
    return {
      success: false,
      error: String(e?.message || e),
      status: 500,
    };
  }
}
