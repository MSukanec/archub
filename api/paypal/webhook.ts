import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(410).json({
    ok: false,
    message: "Este endpoint no se usa. El webhook válido es la Edge Function `paypal_webhook` en Supabase."
  });
}
