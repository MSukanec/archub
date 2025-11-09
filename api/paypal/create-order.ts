import type { VercelRequest, VercelResponse } from "@vercel/node";
import { corsHeaders, paypalBase, getAccessToken } from "./_utils";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.setHeader("Access-Control-Allow-Origin", "*").setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"]).setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"]).status(200).send("ok");
  if (req.method !== "POST") return res.setHeader("Access-Control-Allow-Origin", "*").status(405).json({ ok:false, error:"Method not allowed" });

  try {
    const { user_id, course_slug, amount_usd, description = "Seencel purchase" } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!user_id || !course_slug || !amount_usd) {
      return res.setHeader("Access-Control-Allow-Origin", "*").status(400).json({ ok:false, error:"Missing user_id, course_slug or amount_usd" });
    }

    // Resolve course_id from course_slug
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', course_slug)
      .single();

    if (courseError || !course) {
      return res.setHeader("Access-Control-Allow-Origin", "*").status(404).json({ ok:false, error:"Course not found" });
    }

    const base = paypalBase();
    const token = await getAccessToken();

    // Use dynamic origin from request (works in Replit preview and production)
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const returnBase = `${protocol}://${host}`;
    
    // Generate unique invoice_id (PayPal requires uniqueness for each transaction)
    const uniqueInvoiceId = `user:${user_id};course:${course.id};ts:${Date.now()}`;
    
    const body = {
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: "USD", value: String(amount_usd) },
        description,
        invoice_id: uniqueInvoiceId,
      }],
      application_context: {
        brand_name: "Seencel",
        user_action: "PAY_NOW",
        return_url: `${returnBase}/api/paypal/capture-and-redirect?course_slug=${course_slug}`,
        cancel_url: `${returnBase}/learning/courses`,
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
