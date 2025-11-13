import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSubscriptionOrder } from "../lib/handlers/checkout/paypal/createSubscriptionOrder";
import { handleCorsPreflight, handleCorsHeaders } from "../lib/handlers/checkout/shared/cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(res);
  }

  if (req.method !== "POST") {
    return handleCorsHeaders(res).status(405).json({ ok: false, error: "Method not allowed" });
  }

  const result = await createSubscriptionOrder(req);

  if (!result.success) {
    return handleCorsHeaders(res).status(result.status || 500).json({ 
      ok: false, 
      error: result.error,
      details: 'details' in result ? result.details : undefined
    });
  }

  return handleCorsHeaders(res).status(200).json({ 
    ok: true, 
    order_id: result.orderId, 
    approval_url: result.approvalUrl 
  });
}
