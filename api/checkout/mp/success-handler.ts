import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { course_slug, payment_id, status } = req.query;

    if (!course_slug) {
      return res.redirect(`/learning/courses?payment=failed&reason=missing_slug`);
    }

    const courseSlug = String(course_slug);

    console.log("[MP success-handler] Payment success redirect:", { 
      courseSlug, 
      payment_id, 
      status 
    });

    // Redirect to frontend - the webhook will handle the actual enrollment
    // The payment has already been processed by MercadoPago and the webhook will be called
    return res.redirect(`/learning/courses/${courseSlug}?payment=success`);
  } catch (e: any) {
    console.error("[MP success-handler] Error:", e);
    const courseSlug = String(req.query.course_slug || "");
    return res.redirect(`/learning/courses/${courseSlug || ""}?payment=error`);
  }
}
