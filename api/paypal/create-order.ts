import type { VercelRequest, VercelResponse } from "@vercel/node";
import { corsHeaders, paypalBase, getAccessToken } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.setHeader("Access-Control-Allow-Origin", "*").setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"]).setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"]).status(200).send("ok");
  if (req.method !== "POST") return res.setHeader("Access-Control-Allow-Origin", "*").status(405).json({ ok:false, error:"Method not allowed" });

  try {
    const { user_id, course_slug, amount_usd, description = "Archub purchase" } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!user_id || !course_slug || !amount_usd) {
      return res.setHeader("Access-Control-Allow-Origin", "*").status(400).json({ ok:false, error:"Missing user_id, course_slug or amount_usd" });
    }

    const base = paypalBase();
    const token = await getAccessToken();

    const returnBase = process.env.CHECKOUT_RETURN_URL_BASE || "https://localhost:3000";
    const body = {
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: "USD", value: String(amount_usd) },
        description,
        custom_id: `user:${user_id};course:${course_slug}`,
      }],
      application_context: {
        brand_name: "Archub",
        user_action: "PAY_NOW",
        return_url: `${returnBase}/checkout/paypal/return`,
        cancel_url: `${returnBase}/checkout/paypal/cancel`,
      }
    };

    const r = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!r.ok) return res.setHeader("Access-Control-Allow-Origin", "*").status(r.status).json({ ok:false, error:j });

    return res.setHeader("Access-Control-Allow-Origin", "*").status(200).json({ ok:true, order:j });
  } catch (e:any) {
    return res.setHeader("Access-Control-Allow-Origin", "*").status(500).json({ ok:false, error:String(e?.message||e) });
  }
}
