import type { VercelRequest, VercelResponse } from "@vercel/node";
import { corsHeaders, paypalBase, getAccessToken } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.setHeader("Access-Control-Allow-Origin", "*").setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"]).setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"]).status(200).send("ok");
  if (req.method !== "POST") return res.setHeader("Access-Control-Allow-Origin", "*").status(405).json({ ok:false, error:"Method not allowed" });

  try {
    const { orderId } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!orderId) return res.setHeader("Access-Control-Allow-Origin", "*").status(400).json({ ok:false, error:"Missing orderId" });

    const base = paypalBase();
    const token = await getAccessToken();
    const r = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
    });
    const j = await r.json();
    if (!r.ok) return res.setHeader("Access-Control-Allow-Origin", "*").status(r.status).json({ ok:false, error:j });

    return res.setHeader("Access-Control-Allow-Origin", "*").status(200).json({ ok:true, capture:j });
  } catch (e:any) {
    return res.setHeader("Access-Control-Allow-Origin", "*").status(500).json({ ok:false, error:String(e?.message||e) });
  }
}
