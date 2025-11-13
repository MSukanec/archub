import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createCourseOrder } from "../_lib/handlers/checkout/paypal/createCourseOrder";
import { handleCorsPreflight, handleCorsHeaders } from "../_lib/handlers/checkout/shared/cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(res);
  }

  if (req.method !== "POST") {
    return handleCorsHeaders(res).status(405).json({ ok: false, error: "Method not allowed" });
  }

  const result = await createCourseOrder(req);

  if (!result.success) {
    return handleCorsHeaders(res).status(result.status || 500).json({ 
      ok: false, 
      error: result.error,
      details: 'details' in result ? result.details : undefined
    });
  }

  if ('freeEnrollment' in result && result.freeEnrollment) {
    return handleCorsHeaders(res).status(200).json({
      ok: true,
      free_enrollment: true,
      coupon_code: result.couponCode,
      coupon_id: result.couponId
    });
  }

  return handleCorsHeaders(res).status(200).json({ 
    ok: true, 
    order_id: result.orderId, 
    approval_url: result.approvalUrl 
  });
}
