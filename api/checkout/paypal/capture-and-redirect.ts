import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServiceSupabaseClient } from "../../lib/handlers/checkout/shared/auth.js";
import { capturePayPalOrder } from "../../lib/handlers/checkout/paypal/api.js";
import { logPaymentEvent } from "../../lib/handlers/checkout/shared/events.js";
import { insertPayment } from "../../lib/handlers/checkout/shared/payments.js";
import { upsertEnrollment } from "../../lib/handlers/checkout/shared/enrollments.js";
import { getCourseIdBySlug } from "../../lib/handlers/checkout/shared/helpers.js";
import { decodeInvoiceId, decodeCustomId } from "../../lib/handlers/checkout/paypal/encoding.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { token, course_slug } = req.query;

    if (!token || !course_slug) {
      return res.redirect(`/learning/courses?payment=failed&reason=missing_params`);
    }

    const orderId = String(token);
    const courseSlug = String(course_slug);

    console.log("[PayPal capture-and-redirect] Capturing order:", { orderId, courseSlug });

    // Capture the PayPal order
    const capture = await capturePayPalOrder(orderId);
    const supabase = createServiceSupabaseClient();

    // Extract metadata
    const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;
    const invoiceId = capture.purchase_units?.[0]?.invoice_id;

    let user_id: string | undefined;
    let course_slug_from_metadata: string | undefined;
    let coupon_code: string | undefined;
    let coupon_id: string | undefined;

    // Try to decode custom_id first (preferred)
    if (customId) {
      const decoded = decodeCustomId(customId);
      user_id = decoded.userId;
      course_slug_from_metadata = decoded.productSlug;
      coupon_code = decoded.couponCode;
      coupon_id = decoded.couponId;
    }

    // Fallback to invoice_id
    if (!user_id && invoiceId) {
      const decoded = decodeInvoiceId(invoiceId);
      user_id = decoded.userId;
    }

    // SECURITY: Always resolve course_id from slug (NEVER trust metadata as UUID)
    const course_id = await getCourseIdBySlug(supabase, courseSlug);

    if (!course_id) {
      console.error("[PayPal capture-and-redirect] Course not found:", courseSlug);
      return res.redirect(`/learning/courses?payment=failed&reason=course_not_found`);
    }

    const paymentId = capture.id;
    const status = capture.status;
    const amount = Number(capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || 0);
    const currency = capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code || "USD";

    // Log payment event
    await logPaymentEvent(supabase, "paypal", {
      providerEventId: paymentId,
      providerEventType: "capture.redirect",
      status: status === "COMPLETED" ? "PROCESSED" : "FAILED",
      rawPayload: capture,
      orderId: orderId,
      customId: customId || null,
      userHint: user_id || null,
      courseHint: courseSlug,
      providerPaymentId: paymentId,
      amount: amount || null,
      currency: currency,
    });

    if (status === "COMPLETED" && user_id) {
      // Insert payment record
      await insertPayment(supabase, "paypal", {
        providerPaymentId: paymentId,
        userId: user_id,
        courseId: course_id,
        amount: amount || null,
        currency: currency,
        status: "completed",
        productType: "course",
      });

      // Enroll user in course
      await upsertEnrollment(supabase, user_id, course_id, 12);

      console.log("[PayPal capture-and-redirect] ✅ Enrollment successful");
      return res.redirect(`/learning/courses/${courseSlug}?payment=success`);
    }

    console.log("[PayPal capture-and-redirect] ❌ Capture failed or incomplete");
    return res.redirect(`/learning/courses/${courseSlug}?payment=failed`);
  } catch (e: any) {
    console.error("[PayPal capture-and-redirect] Error:", e);
    const courseSlug = String(req.query.course_slug || "");
    return res.redirect(`/learning/courses/${courseSlug || ""}?payment=error`);
  }
}
