// /api/mp/webhook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/** ====== ENV ====== */
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Detectar modo test/producción
const MP_MODE = process.env.MP_MODE || "production";
const isTestMode = MP_MODE === "test";

// Usar credenciales según el modo
const MP_ACCESS_TOKEN = isTestMode 
  ? (process.env.MP_ACCESS_TOKEN_TEST || "")
  : (process.env.MP_ACCESS_TOKEN || "");
const MP_WEBHOOK_SECRET = isTestMode
  ? (process.env.MP_WEBHOOK_SECRET_TEST || "")
  : (process.env.MP_WEBHOOK_SECRET || "");

console.log(`[MP webhook] Modo: ${isTestMode ? '🧪 TEST' : '💰 PRODUCCIÓN'}`);

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

/** Inserta en payment_events (igual que PayPal) */
async function logPaymentEvent(row: {
  provider_event_id?: string | null;
  provider_event_type: string;
  status: string;
  raw_payload: any;
  order_id?: string | null;
  custom_id?: string | null;
  user_hint?: string | null;
  course_hint?: string | null;
  provider_payment_id?: string | null;
  amount?: number | null;
  currency?: string | null;
}) {
  const insert = {
    provider: "mercadopago",
    provider_event_id: row.provider_event_id ?? null,
    provider_event_type: row.provider_event_type,
    status: row.status,
    raw_payload: row.raw_payload ?? {},
    order_id: row.order_id ?? null,
    custom_id: row.custom_id ?? null,
    user_hint: row.user_hint ?? null,
    course_hint: row.course_hint ?? null,
    provider_payment_id: row.provider_payment_id ?? null,
    amount: row.amount ?? null,
    currency: row.currency ?? null,
  };

  const { error } = await supabase.from("payment_events").insert(insert);
  if (error)
    console.error("[webhook] payment_events insert error:", error, insert);
  else
    console.log("[webhook] ✅ payment_event insertado");
}

/** Inserta en payments (solo si el pago está aprobado) */
async function insertPayment(data: {
  provider_payment_id: string;
  user_id: string;
  course_id: string;
  amount: number | null;
  currency: string;
  status: string;
}) {
  const { error } = await supabase.from("payments").insert({
    provider: "mercadopago",
    provider_payment_id: data.provider_payment_id,
    user_id: data.user_id,
    course_id: data.course_id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
  });

  if (error) {
    // Si el error es por duplicado (código 23505), lo ignoramos
    if (error.code === '23505') {
      console.log('[webhook] ⚠️ Payment ya existe (ignorado)');
    } else {
      console.error("[webhook] payments insert error:", error);
    }
  } else {
    console.log("[webhook] ✅ payment insertado");
  }
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
      const effectiveMonths = md.months ?? fromExt.months ?? 12;
      const resolvedUserId = md.user_id ?? fromExt.user_id ?? null;
      const resolvedSlug = md.course_slug ?? fromExt.course_slug ?? null;

      // course_id si podemos
      let course_id: string | null = null;
      if (resolvedSlug) course_id = await getCourseIdBySlug(resolvedSlug);

      const providerPaymentId = String(pay?.id ?? "");
      const status = String(pay?.status ?? "");
      const amount = Number(pay?.transaction_amount ?? 0);
      const currency = String(pay?.currency_id ?? "ARS");

      // 1. Insertar en payment_events
      await logPaymentEvent({
        provider_event_id: providerPaymentId,
        provider_event_type: "payment.webhook",
        status: "PROCESSED",
        raw_payload: pay,
        order_id: String(pay?.order?.id ?? ""),
        custom_id: md.external_reference ?? null,
        user_hint: resolvedUserId,
        course_hint: resolvedSlug,
        provider_payment_id: providerPaymentId,
        amount: amount || null,
        currency: currency,
      });

      // 2. Si está aprobado, insertar en payments y enrollment
      if (status === "approved" && resolvedUserId && course_id) {
        // Insert payment
        await insertPayment({
          provider_payment_id: providerPaymentId,
          user_id: resolvedUserId,
          course_id: course_id,
          amount: amount || null,
          currency: currency,
          status: "completed",
        });

        // Upsert enrollment
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
      const effectiveMonths = md.months ?? fromExt.months ?? 12;
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

      const orderId = String(mo?.id ?? "");
      const amount = Number(mo?.total_amount ?? 0);

      // 1. Insertar en payment_events
      await logPaymentEvent({
        provider_event_id: orderId,
        provider_event_type: "merchant_order.webhook",
        status: "PROCESSED",
        raw_payload: mo,
        order_id: orderId,
        custom_id: md.external_reference ?? null,
        user_hint: resolvedUserId,
        course_hint: resolvedSlug,
        provider_payment_id: null,
        amount: amount || null,
        currency: null,
      });

      // 2. Si está aprobado, insertar en payments y enrollment
      if (approved && resolvedUserId && course_id) {
        // Obtener el payment_id del primer pago aprobado
        const approvedPayment = mo?.payments?.find((p: any) => String(p?.status) === "approved");
        const providerPaymentId = approvedPayment ? String(approvedPayment.id) : null;

        if (providerPaymentId) {
          await insertPayment({
            provider_payment_id: providerPaymentId,
            user_id: resolvedUserId,
            course_id: course_id,
            amount: amount || null,
            currency: "ARS",
            status: "completed",
          });
        }

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
    await logPaymentEvent({
      provider_event_id: finalId ?? null,
      provider_event_type: type || "unknown.webhook",
      status: "PROCESSED",
      raw_payload: body,
      order_id: null,
      custom_id: null,
      user_hint: null,
      course_hint: null,
      provider_payment_id: null,
      amount: null,
      currency: null,
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
