import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCorsPreflight, handleCorsHeaders } from "../../lib/handlers/checkout/shared/cors";
import { processWebhook } from "../../lib/handlers/checkout/paypal/processWebhook";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(res);
  }

  if (req.method === "GET") {
    return handleCorsHeaders(res)
      .status(200)
      .json({ ok: true });
  }

  if (req.method !== "POST") {
    return handleCorsHeaders(res)
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  const result = await processWebhook(req);

  if (!result.success) {
    return handleCorsHeaders(res)
      .status(500)
      .json({ ok: false, error: result.error });
  }

  return handleCorsHeaders(res)
    .status(200)
    .json({ 
      ok: true, 
      processed: result.processed, 
      event_type: result.eventType 
    });
}
