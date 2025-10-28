// /api/mp/webhook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/** ====== ENV ====== */
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || ""; // si lo usás en la URL

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** ====== UTILS ====== */
function send(res: VercelResponse, code: number, body: any) {
  return res
    .status(code)
    .setHeader("Content-Type", "application/json")
    .send(body);
}

async function parseBody(req: VercelRequest): Promise<any> {
  try {
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string" && req.body.trim()) {
      try {
        return JSON.parse(req.body);
      } catch {}
    }
  } catch {}
  try {
    // @ts-ignore
    const raw: string = await new Promise((resolve) => {
      let data = "";
      // @ts-ignore
      req.on("data", (c: Buffer) => (data += c.toString("utf8")));
      // @ts-ignore
      req.on("end", () => resolve(data));
    });
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {}
    const p = new URLSearchParams(raw);
    const obj = Object.fromEntries(p.entries());
    const id = p.get("data.id") || p.get("id");
    if (!obj["data"] && id) (obj as any).data = { id };
    return obj;
  } catch {
    return {};
  }
}

function addMonths(d: Date, months: number) {
  const n = new Date(d);
  n.setMonth(n.getMonth() + months);
  return n;
}

async function mpGetPayment(id: string) {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!r.ok) throw new Error(`mpGetPayment ${id} -> ${r.status}`);
  return r.json();
}

async function mpGetMerchantOrder(id: string) {
  const r = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!r.ok) throw new Error(`mpGetMerchantOrder ${id} -> ${r.status}`);
  return r.json();
}

/** Extrae metadata útil */
function extractMetadata(obj: any): {
  user_id?: string | null;
  course_slug?: string | null;
  months?: number | null;
  external_reference?: string | null;
} {
  const md = obj?.metadata || obj?.additional_info || {};
  const months =
    md?.months != null
      ? Number(md.months)
      : obj?.months != null
        ? Number(obj.months)
        : null;

  const user_id =
    md?.user_id || obj?.user_id || obj?.payer?.id || obj?.client_id || null;

  const course_slug =
    md?.course_slug || obj?.course_slug || obj?.items?.[0]?.category_id || null;

  const external_reference =
    obj?.external_reference || md?.external_reference || null;

  return {
    user_id: user_id ? String(user_id) : null,
    course_slug: course_slug ? String(course_slug) : null,
    months: months && !Number.isNaN(months) ? months : null,
    external_reference: external_reference ? String(external_reference) : null,
  };
}

/** Si external_reference = "user|slug|months" lo parseamos */
function parseExtRef(ext?: string | null) {
  if (!ext) return {};
  const [u, s, m] = String(ext).split("|");
  return {
    user_id: u || null,
    course_slug: s || null,
    months: m === "null" ? null : Number.isFinite(Number(m)) ? Number(m) : null,
  };
}

/** Busca course_id por slug */
async function getCourseIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[webhook] getCourseIdBySlug error:", error);
    return null;
  }
  return data?.id ?? null;
}

/** Upsert de enrollment */
async function upsertEnrollment(args: {
  user_id: string;
  course_id: string;
  months?: number | null;
}) {
  const startedAt = new Date();
  const expiresAt =
    args.months && args.months > 0 ? addMonths(startedAt, args.months) : null;

  const { error } = await supabase.from("course_enrollments").upsert(
    {
      user_id: args.user_id,
      course_id: args.course_id,
      status: "active",
      started_at: startedAt.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" },
  );
  if (error) console.error("[webhook] upsertEnrollment error:", error);
}

/** Inserta en payments_log usando TU esquema */
async function logPaymentRow(row: {
  provider_event_type: "payment" | "merchant_order" | "other";
  provider_payment_id?: string | null;
  provider_order_id?: string | null;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
  external_reference?: string | null;
  raw_payload: any;
  user_id?: string | null;
  course_id?: string | null;
}) {
  const insert = {
    provider: "mp",
    provider_payment_id: row.provider_payment_id ?? null,
    provider_order_id: row.provider_order_id ?? null,
    provider_event_type: row.provider_event_type,
    status: row.status ?? null,
    amount: row.amount ?? null,
    currency: row.currency ?? null,
    external_reference: row.external_reference ?? null,
    raw_payload: row.raw_payload ?? {},
    user_id: row.user_id ?? null,
    course_id: row.course_id ?? null,
  };

  const { error } = await supabase.from("payments_log").insert(insert);
  if (error)
    console.error("[webhook] payments_log insert error:", error, insert);
}

/** ====== HANDLER ====== */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Preflight
  if (req.method === "OPTIONS") {
    return res
      .status(204)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader(
        "Access-Control-Allow-Headers",
        "authorization, x-client-info, apikey, content-type",
      )
      .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
      .end();
  }

  // GET de salud
  if (req.method === "GET") {
    if (req.query?.ping) return send(res, 200, { ok: true, pong: true });
    return send(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return send(res, 200, { ok: true, note: "Method not processed" });
  }

  try {
    // Validación de secret (si lo usás en la URL del webhook)
    if (MP_WEBHOOK_SECRET) {
      const q = String(req.query?.secret ?? "");
      if (!q || q !== MP_WEBHOOK_SECRET) {
        console.warn("[mp/webhook] secret mismatch");
        return send(res, 200, { ok: true, ignored: "secret mismatch" });
      }
    }

    const body = await parseBody(req);
    const type =
      body?.type ||
      body?.topic ||
      (typeof body?.action === "string"
        ? String(body.action).split(".")[0]
        : undefined);

    const idFromBody = body?.data?.id || body?.id || null;
    const idFromQuery =
      (req.query?.["data.id"] as string) ||
      (req.query?.["id"] as string) ||
      null;
    const finalId = idFromBody || idFromQuery || null;

    // === PAYMENT ===
    if (type === "payment" && finalId) {
      const pay = await mpGetPayment(String(finalId));
      const md = extractMetadata(pay);
      const fromExt = parseExtRef(md.external_reference);
      const effectiveMonths = md.months ?? fromExt.months ?? null;
      const resolvedUserId = md.user_id ?? fromExt.user_id ?? null;
      const resolvedSlug = md.course_slug ?? fromExt.course_slug ?? null;

      // course_id si podemos
      let course_id: string | null = null;
      if (resolvedSlug) course_id = await getCourseIdBySlug(resolvedSlug);

      await logPaymentRow({
        provider_event_type: "payment",
        provider_payment_id: String(pay?.id ?? ""),
        provider_order_id: String(pay?.order?.id ?? ""),
        status: String(pay?.status ?? ""),
        amount: Number(pay?.transaction_amount ?? 0),
        currency: String(pay?.currency_id ?? ""),
        external_reference: md.external_reference ?? null,
        raw_payload: pay,
        user_id: resolvedUserId ?? null,
        course_id: course_id ?? null,
      });

      if (String(pay?.status) === "approved" && resolvedUserId && course_id) {
        await upsertEnrollment({
          user_id: resolvedUserId,
          course_id,
          months: effectiveMonths,
        });
      }

      return send(res, 200, { ok: true, processed: "payment", id: finalId });
    }

    // === MERCHANT ORDER ===
    if (type === "merchant_order" && finalId) {
      const mo = await mpGetMerchantOrder(String(finalId));
      const md = extractMetadata(mo);
      const fromExt = parseExtRef(md.external_reference);
      const effectiveMonths = md.months ?? fromExt.months ?? null;
      const resolvedUserId = md.user_id ?? fromExt.user_id ?? null;
      const resolvedSlug =
        md.course_slug ??
        fromExt.course_slug ??
        mo?.items?.[0]?.category_id ??
        null;

      // ¿Hay pago aprobado?
      const approved = Array.isArray(mo?.payments)
        ? mo.payments.some((p: any) => String(p?.status) === "approved")
        : false;

      let course_id: string | null = null;
      if (resolvedSlug) course_id = await getCourseIdBySlug(resolvedSlug);

      await logPaymentRow({
        provider_event_type: "merchant_order",
        provider_payment_id: null,
        provider_order_id: String(mo?.id ?? ""),
        status: String(mo?.status ?? ""),
        amount: Number(mo?.total_amount ?? 0),
        currency: null,
        external_reference: md.external_reference ?? null,
        raw_payload: mo,
        user_id: resolvedUserId ?? null,
        course_id: course_id ?? null,
      });

      if (approved && resolvedUserId && course_id) {
        await upsertEnrollment({
          user_id: resolvedUserId,
          course_id,
          months: effectiveMonths,
        });
      }

      return send(res, 200, {
        ok: true,
        processed: "merchant_order",
        id: finalId,
      });
    }

    // === OTROS / DESCONOCIDOS ===
    await logPaymentRow({
      provider_event_type: "other",
      provider_payment_id: null,
      provider_order_id: null,
      status: null,
      amount: null,
      currency: null,
      external_reference: null,
      raw_payload: body,
      user_id: null,
      course_id: null,
    });

    return send(res, 200, {
      ok: true,
      received: true,
      type: type ?? null,
      id: finalId ?? null,
    });
  } catch (e: any) {
    console.error("[mp/webhook] error:", e);
    // Respondemos 200 igual para evitar reintentos infinitos
    return send(res, 200, { ok: true, error: "logged" });
  }
}
