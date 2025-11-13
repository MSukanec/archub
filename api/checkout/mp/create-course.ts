import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCorsPreflight, handleCorsHeaders } from "../../_lib/handlers/checkout/shared/cors";
import { createCoursePreference } from "../../_lib/handlers/checkout/mp/createCoursePreference";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(res);
  }

  if (req.method !== "POST") {
    return handleCorsHeaders(res)
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  const result = await createCoursePreference(req);

  if (!result.success) {
    return handleCorsHeaders(res)
      .status(result.status || 500)
      .json({ ok: false, ...result });
  }

  return handleCorsHeaders(res)
    .status(200)
    .json({ 
      ok: true, 
      init_point: result.initPoint, 
      preference_id: result.preferenceId 
    });
}
