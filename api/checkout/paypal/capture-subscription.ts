import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCorsPreflight, handleCorsHeaders } from "../../_lib/handlers/checkout/shared/cors";
import { captureSubscriptionOrder } from "../../_lib/handlers/checkout/paypal/captureSubscriptionOrder";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(res);
  }

  if (req.method !== "GET") {
    return handleCorsHeaders(res)
      .status(405)
      .setHeader("Content-Type", "text/html")
      .send(`
        <!DOCTYPE html>
        <html>
          <head><title>Error - Seencel</title></head>
          <body style="font-family: system-ui; text-align: center; padding: 2rem;">
            <h1>⚠️ Method Not Allowed</h1>
            <p>Este endpoint solo acepta solicitudes GET.</p>
          </body>
        </html>
      `);
  }

  const result = await captureSubscriptionOrder(req);

  if (!result.success) {
    return handleCorsHeaders(res)
      .status(500)
      .setHeader("Content-Type", "text/html")
      .send(result.html);
  }

  return handleCorsHeaders(res)
    .status(200)
    .setHeader("Content-Type", "text/html")
    .send(result.html);
}
