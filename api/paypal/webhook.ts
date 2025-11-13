import type { VercelRequest, VercelResponse } from "@vercel/node";
import { processWebhook } from "../lib/handlers/checkout/paypal/processWebhook";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-sig, paypal-transmission-time, paypal-cert-url, paypal-auth-algo, webhook-id",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res
      .status(200)
      .setHeader("Access-Control-Allow-Origin", cors["Access-Control-Allow-Origin"])
      .setHeader("Access-Control-Allow-Headers", cors["Access-Control-Allow-Headers"])
      .setHeader("Access-Control-Allow-Methods", cors["Access-Control-Allow-Methods"])
      .send("ok");
  }

  if (req.method === "GET") {
    return res.status(200).setHeader("Access-Control-Allow-Origin", "*").json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).setHeader("Access-Control-Allow-Origin", "*").json({ ok: false, error: "Method not allowed" });
  }

  const result = await processWebhook(req);

  if (!result.success) {
    return res.status(200).setHeader("Access-Control-Allow-Origin", "*").json({ 
      ok: true, 
      warn: result.warn || "handler_error",
      error: result.error 
    });
  }

  return res.status(200).setHeader("Access-Control-Allow-Origin", "*").json({ 
    ok: true, 
    processed: result.processed, 
    event_type: result.eventType 
  });
}
