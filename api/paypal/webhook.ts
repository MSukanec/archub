// /api/paypal/webhook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-sig, paypal-transmission-time, paypal-cert-url, paypal-auth-algo, webhook-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// ---- Supabase admin client ----
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

// ---- PayPal config ----
const PAYPAL_BASE_URL =
  process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;

// ---- Helpers ----
async function getPPToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");
  const r = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error(`paypal_token_${r.status}`);
  const j = await r.json();
  return j.access_token;
}

async function fetchOrderInvoiceId(orderId: string) {
  try {
    const token = await getPPToken();
    const r = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.purchase_units?.[0]?.invoice_id ?? null;
  } catch {
    return null;
  }
}

function deepFindString(obj: any, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (key in obj && typeof obj[key] === "string") return obj[key];
  for (const k of Object.keys(obj)) {
    const found = deepFindString(obj[k], key);
    if (found) return found;
  }
  return null;
}

function extractOrderId(evt: any): string | null {
  const r = evt?.resource;
  if (
    evt?.event_type?.startsWith("CHECKOUT.ORDER") &&
    typeof r?.id === "string"
  )
    return r.id;
  const rel = r?.supplementary_data?.related_ids;
  if (rel?.order_id) return rel.order_id;
  const up = Array.isArray(r?.links)
    ? r.links.find(
        (l: any) => l?.rel === "up" && l.href?.includes("/v2/checkout/orders/"),
      )
    : null;
  if (up?.href) {
    const m = up.href.match(/\/v2\/checkout\/orders\/([^/?]+)/);
    if (m?.[1]) return m[1];
  }
  return deepFindString(evt, "order_id");
}

function parseInvoiceId(invoiceId: string) {
  const out: Record<string, string> = {};
  if (!invoiceId) return out;
  for (const part of invoiceId.split(";")) {
    const [k, v] = part.split(":").map((s) => s.trim());
    if (k && v) out[k] = v;
  }
  return out;
}

// ---- Handler ----
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Headers", cors["Access-Control-Allow-Headers"])
      .setHeader("Access-Control-Allow-Methods", cors["Access-Control-Allow-Methods"])
      .send("ok");
  }

  if (req.method !== "POST") {
    return res.status(405).setHeader("Access-Control-Allow-Origin", "*")
      .json({ ok: false, error: "Method not allowed" });
  }

  try {
    const json = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const eventType = json?.event_type ?? "UNKNOWN";

    let order_id = extractOrderId(json);
    let invoice_id = json?.resource?.purchase_units?.[0]?.invoice_id ?? null;
    if (!invoice_id && order_id)
      invoice_id = await fetchOrderInvoiceId(order_id);

    let user_hint: string | null = null;
    let course_hint: string | null = null;
    if (invoice_id) {
      const parsed = parseInvoiceId(invoice_id);
      user_hint = parsed.user ?? null;
      course_hint = parsed.course ?? null;
    }

    await supabase.from("paypal_events").insert({
      provider_event_id: json.id ?? null,
      provider_event_type: eventType,
      status: "RECEIVED",
      raw_payload: json,
      order_id,
      custom_id: invoice_id,
      user_hint,
      course_hint,
    });

    if (eventType === "PAYMENT.CAPTURE.COMPLETED" && user_hint && course_hint) {
      await supabase.from("course_enrollments").upsert(
        {
          user_id: user_hint,
          course_id: course_hint,
          status: "active",
          started_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id" },
      );
    }

    return res.status(200).setHeader("Access-Control-Allow-Origin", "*").json({ ok: true });
  } catch (e: any) {
    console.error("[PayPal webhook] Error:", e);
    return res.status(200).setHeader("Access-Control-Allow-Origin", "*")
      .json({ ok: true, warn: "handler_error", error: String(e) });
  }
}
