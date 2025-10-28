// /api/mp/webhook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/** ============ C O N F I G ============ */
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || ""; // si lo usás

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** ============ U T I L S ============ */
function json(res: VercelResponse, code: number, body: any) {
  return res
    .status(code)
    .setHeader("Content-Type", "application/json")
    .send(body);
}

// parsea JSON o x-www-form-urlencoded
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

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
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

/** Inserta una fila de log; ajusta nombres si tu tabla difiere */
async function logPayment(payload: {
  provider: "mp";
  payment_id?: string | null;
  order_id?: string | null;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
  user_id?: string | null;
  course_slug?: string | null;
  raw: any;
}) {
  // Cambia "payments_log" por el nombre real si es distinto
  await supabase.from("payments_log").insert({
    provider: payload.provider,
    payment_id: payload.payment_id ?? null,
    order_id: payload.order_id ?? null,
    status: payload.status ?? null,
    amount: payload.amount ?? null,
    currency: payload.currency ?? null,
    user_id: payload.user_id ?? null,
    course_slug: payload.course_slug ?? null,
    raw: payload.raw ?? null,
  });
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

/** Upsert de enrollment con expires_at en base a months */
async function upsertEnrollment(args: {
  user_id: string;
  course_id: string;
  months?: number | null; // si null → acceso de por vida
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

/** Extrae metadata de donde pueda venir */
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
    md?.course_slug ||
    obj?.course_slug ||
    obj?.items?.[0]?.category_id || // a veces lo ponemos ahí
    null;

  const external_reference =
    obj?.external_reference || md?.external_reference || null;

  return {
    user_id: user_id ? String(user_id) : null,
    course_slug: course_slug ? String(course_slug) : null,
    months: months && !Number.isNaN(months) ? months : null,
    external_reference: external_reference ? String(external_reference) : null,
  };
}

/** ============ H A N D L E R ============ */
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

  // Ping simple
  if (req.method === "GET") {
    if (req.query?.ping) return json(res, 200, { ok: true, pong: true });
    return json(res, 200, { ok: true, note: "GET acknowledged" });
  }

  if (req.method !== "POST") {
    // 200 para evitar reintentos de MP
    return json(res, 200, { ok: true, note: "Method not processed" });
  }

  try {
    // validar secret en query (si configuraste uno en MP)
    if (MP_WEBHOOK_SECRET) {
      const q = String(req.query?.secret ?? "");
      if (!q || q !== MP_WEBHOOK_SECRET) {
        console.warn("[mp/webhook] secret mismatch");
        return json(res, 200, { ok: true, ignored: "secret mismatch" });
      }
    }

    const body = await parseBody(req);
    console.log("⚡ MP Webhook (raw):", JSON.stringify(body).slice(0, 1200));

    // Normalizamos el "tipo" y el "id" enviados por MP
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

    // —— Branch 1: llegó "payment" con ID de pago
    if (type === "payment" && finalId) {
      const pay = await mpGetPayment(String(finalId));
      const md = extractMetadata(pay);

      // log
      await logPayment({
        provider: "mp",
        payment_id: String(pay?.id ?? ""),
        order_id: String(pay?.order?.id ?? ""),
        status: String(pay?.status ?? ""),
        amount: Number(pay?.transaction_amount ?? 0),
        currency: String(pay?.currency_id ?? ""),
        user_id: md.user_id ?? null,
        course_slug: md.course_slug ?? null,
        raw: pay,
      });

      // si aprobado → upsert enrollment
      if (String(pay?.status) === "approved") {
        const user_id = md.user_id || md.external_reference || null;
        const slug = md.course_slug || null;
        if (user_id && slug) {
          const course_id = await getCourseIdBySlug(slug);
          if (course_id) {
            await upsertEnrollment({
              user_id,
              course_id,
              months: md.months ?? null, // null → expires_at = NULL (lifetime)
            });
          } else {
            console.warn("[webhook] course not found for slug:", slug);
          }
        } else {
          console.warn("[webhook] missing user_id or course_slug in metadata");
        }
      }

      return json(res, 200, { ok: true, processed: "payment", id: finalId });
    }

    // —— Branch 2: llegó "merchant_order" con ID de orden
    if (type === "merchant_order" && finalId) {
      const mo = await mpGetMerchantOrder(String(finalId));
      const md = extractMetadata(mo);

      await logPayment({
        provider: "mp",
        payment_id: null,
        order_id: String(mo?.id ?? ""),
        status: String(mo?.status ?? ""),
        amount: Number(mo?.total_amount ?? 0),
        currency: null,
        user_id: md.user_id ?? null,
        course_slug: md.course_slug ?? null,
        raw: mo,
      });

      // si ya hay pagos asociados aprobados → procesamos enrollment
      const approved = Array.isArray(mo?.payments)
        ? mo.payments.some((p: any) => String(p?.status) === "approved")
        : false;

      if (approved) {
        const user_id = md.user_id || md.external_reference || null;
        const slug = md.course_slug || mo?.items?.[0]?.category_id || null; // fallback
        if (user_id && slug) {
          const course_id = await getCourseIdBySlug(slug);
          if (course_id) {
            await upsertEnrollment({
              user_id,
              course_id,
              months: md.months ?? null,
            });
          } else {
            console.warn("[webhook] course not found for slug:", slug);
          }
        } else {
          console.warn(
            "[webhook] missing user_id or course_slug (merchant_order)",
          );
        }
      }

      return json(res, 200, {
        ok: true,
        processed: "merchant_order",
        id: finalId,
      });
    }

    // —— Otro tipo o sin id útil
    await logPayment({
      provider: "mp",
      raw: body,
      payment_id: null,
      order_id: null,
      status: null,
      amount: null,
      currency: null,
      user_id: null,
      course_slug: null,
    });

    return json(res, 200, {
      ok: true,
      received: true,
      type: type ?? null,
      id: finalId ?? null,
    });
  } catch (e: any) {
    console.error("[mp/webhook] error:", e);
    // igual 200 para evitar reintentos infinitos
    return json(res, 200, { ok: true, error: "logged" });
  }
}
