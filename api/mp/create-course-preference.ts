import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createCoursePreference } from "../_lib/handlers/checkout/mp/createCoursePreference";
import { handleCorsPreflight, handleCorsHeaders } from "../_lib/handlers/checkout/shared/cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(res);
  }

  if (req.method !== "POST") {
    return handleCorsHeaders(res).status(405).json({ ok: false, error: "Method not allowed" });
  }

  const result = await createCoursePreference(req);

  if (!result.success) {
    if ('freeEnrollment' in result && result.freeEnrollment) {
      return handleCorsHeaders(res).status(200).json({ 
        ok: false,
        error: "Este cupón otorga acceso gratuito. Usa el flujo de inscripción gratuita.",
        free_enrollment: true,
        coupon_code: result.couponCode,
        reason: result.reason
      });
    }
    return handleCorsHeaders(res).status(result.status || 500).json({ ok: false, error: result.error });
  }

  return handleCorsHeaders(res).status(200).json({ 
    ok: true, 
    init_point: result.initPoint, 
    preference_id: result.preferenceId 
  });
}
