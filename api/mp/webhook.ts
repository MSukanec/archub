import type { VercelRequest, VercelResponse } from "@vercel/node";
import { processWebhook } from "../_lib/handlers/checkout/mp/processWebhook";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res
      .status(204)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type")
      .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
      .end();
  }

  if (req.method === "GET") {
    if (req.query?.ping) {
      return res.status(200).json({ ok: true, pong: true });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, note: "Method not processed" });
  }

  const result = await processWebhook(req);

  if (!result.success) {
    return res.status(200).json({ ok: true, ignored: result.error });
  }

  return res.status(200).json({ ok: true, processed: result.processed, id: result.id });
}
