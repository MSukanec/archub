import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCorsPreflight, handleCorsHeaders } from "../../_lib/handlers/checkout/shared/cors";
import { createCourseOrder } from "../../_lib/handlers/checkout/paypal/createCourseOrder";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(res);
  }

  if (req.method !== "POST") {
    return handleCorsHeaders(res)
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  const result = await createCourseOrder(req);

  if (!result.success) {
    return handleCorsHeaders(res)
      .status(result.status || 500)
      .json({ ok: false, ...result });
  }

  if ('freeEnrollment' in result && result.freeEnrollment) {
    return handleCorsHeaders(res)
      .status(200)
      .json({ 
        ok: true, 
        free_enrollment: true,
        coupon_code: result.couponCode,
        coupon_id: result.couponId
      });
  }

  if ('orderId' in result) {
    return handleCorsHeaders(res)
      .status(200)
      .json({ 
        ok: true, 
        order_id: result.orderId, 
        approval_url: result.approvalUrl 
      });
  }

  return handleCorsHeaders(res)
    .status(500)
    .json({ ok: false, error: "Unexpected result format" });
}
