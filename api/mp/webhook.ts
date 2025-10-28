// /api/mp/webhook.ts
export const config = { runtime: "nodejs", regions: ["gru1"] }; // misma región que tu Supabase

import { env } from "../_lib/env";
import { supabaseAdmin } from "../_lib/supabase-admin";
import { handlePreflight } from "../_lib/cors";

// --- CORS base idéntico a tu Edge ---
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
} as const;

// --- util notify (Discord opcional) ---
async function notify(msg: string) {
  try {
    console.log("[notify]", msg);
    if (!env.DISCORD_WEBHOOK_URL) return;
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: msg.slice(0, 1800) }),
    });
  } catch (e) {
    console.error("[notify] error", e);
  }
}

function normalizeType(raw?: string | null) {
  if (!raw) return "";
  let t = raw.trim().toLowerCase();
  if (t.startsWith("topic_")) t = t.slice(6); // topic_payment_wh -> payment_wh
  if (t.endsWith("_wh")) t = t.slice(0, -3); // payment_wh -> payment
  if (t.includes("merchant_order")) return "merchant_order";
  if (t.includes("payment")) return "payment";
  return "";
}

// Soportar JSON y x-www-form-urlencoded (igual que tu Edge)
async function parseBody(req: Request): Promise<any> {
  const raw = await req.text().catch(() => "");
  if (!raw) return {};
  // JSON
  try {
    return JSON.parse(raw);
  } catch {}
  // urlencoded
  try {
    const p = new URLSearchParams(raw);
    const obj: any = Object.fromEntries(p.entries());
    const dataId = p.get("data.id") || p.get("id") || null;
    if (!obj.data && dataId) obj.data = { id: dataId };
    if (!obj.type && obj.action) obj.type = String(obj.action).split(".")[0];
    return obj;
  } catch {
    return {};
  }
}

async function readPayment(paymentId: string) {
  console.log("[readPayment] id", paymentId);
  const r = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
    },
  );
  const txt = await r.text();
  if (!r.ok) throw new Error(`payments ${r.status}: ${txt}`);
  try {
    return JSON.parse(txt);
  } catch {
    return txt as any;
  }
}

async function readMerchantOrder(orderId: string) {
  console.log("[readMerchantOrder] id", orderId);
  const r = await fetch(
    `https://api.mercadopago.com/merchant_orders/${orderId}`,
    {
      headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
    },
  );
  const txt = await r.text();
  if (!r.ok) throw new Error(`merchant_orders ${r.status}: ${txt}`);
  try {
    return JSON.parse(txt);
  } catch {
    return txt as any;
  }
}

async function processPayment(payment: any) {
  const status = payment?.status; // 'approved', 'rejected', etc
  const amount = Number(payment?.transaction_amount ?? 0);
  const currency = payment?.currency_id ?? null;
  const provider_payment_id = String(payment?.id ?? "");
  const external_reference = payment?.external_reference ?? "";
  console.log(
    "[processPayment] status/amount/currency",
    status,
    amount,
    currency,
  );
  console.log("[processPayment] external_reference", external_reference);

  const [user_id, course_slug] = (external_reference || "").split("|");
  if (!user_id || !course_slug) {
    await notify(`❗ external_reference inválida: ${external_reference}`);
    return;
  }

  const { data: course, error: eCourse } = await supabaseAdmin
    .from("courses")
    .select("id, title")
    .eq("slug", course_slug)
    .maybeSingle();

  if (eCourse || !course) {
    await notify(`❗ curso no encontrado slug=${course_slug}`);
    return;
  }

  // 1) Log de pago
  const { error: eLog } = await supabaseAdmin.from("payments_log").insert({
    user_id,
    course_id: course.id,
    provider: "mercadopago",
    provider_payment_id,
    status,
    amount,
    currency,
    external_reference,
    raw_payload: payment,
  });
  if (eLog) console.error("[payments_log] insert error", eLog);

  // 2) Enroll + notificaciones
  if (status === "approved") {
    const { error: eEnroll } = await supabaseAdmin
      .from("course_enrollments")
      .upsert(
        {
          user_id,
          course_id: course.id,
          status: "active",
          started_at: new Date().toISOString(), // nombre correcto
        },
        { onConflict: "user_id,course_id" },
      );

    if (eEnroll) {
      console.error("[enroll] upsert error", eEnroll);
      await notify(`❗ enroll error: ${JSON.stringify(eEnroll)}`);

      // Notificación al usuario: pago ok pero problema habilitando acceso
      await supabaseAdmin.rpc("notify_user_direct", {
        p_user_id: user_id,
        p_type: "payment_error",
        p_title: "❗ Hubo un problema al habilitar tu curso",
        p_body:
          "Tu pago fue aprobado, pero no pudimos habilitar el acceso automáticamente. Ya estamos revisándolo.",
        p_data: {
          course_id: course.id,
          course_slug,
          provider: "mercadopago",
          payment_id: provider_payment_id,
          amount,
          currency,
        },
        p_created_by: null,
      });
    } else {
      await notify(
        `✅ MP approved: ${amount} ${currency} – ${course.title} – user ${user_id}`,
      );
      // Notificación al usuario: acceso habilitado
      await supabaseAdmin.rpc("notify_user_direct", {
        p_user_id: user_id,
        p_type: "payment",
        p_title: "✅ Pago acreditado",
        p_body: `Ya tenés acceso al curso "${course.title}". ¡Que lo disfrutes!`,
        p_data: {
          course_id: course.id,
          course_slug,
          provider: "mercadopago",
          payment_id: provider_payment_id,
          amount,
          currency,
        },
        p_created_by: null,
      });
    }
  } else {
    // Otros estados: avisar al usuario
    await supabaseAdmin.rpc("notify_user_direct", {
      p_user_id: user_id,
      p_type: "payment_status",
      p_title: `ℹ️ Estado de pago: ${status}`,
      p_body:
        status === "in_process"
          ? "Tu pago está en proceso de verificación. Te avisaremos cuando se acredite."
          : `Estado actual del pago: ${status}.`,
      p_data: {
        course_id: course.id,
        course_slug,
        provider: "mercadopago",
        payment_id: provider_payment_id,
        amount,
        currency,
      },
      p_created_by: null,
    });
    await notify(
      `ℹ️ MP status ${status}: ${amount} ${currency} – ${course.title} – user ${user_id}`,
    );
  }
}

export default async function handler(req: Request) {
  const pre = handlePreflight(req);
  if (pre) return pre;

  // Pase lo que pase, devolvemos 200 (como en tu Edge)
  try {
    const url = new URL(req.url);

    // 1) Validar secret (query)
    const secret = url.searchParams.get("secret");
    if (!secret || secret !== env.MP_WEBHOOK_SECRET) {
      console.warn("[webhook] secret mismatch");
      return new Response("ok", { status: 200, headers: cors });
    }

    // 2) Extraer tipo e id (query y body)
    const rawTypeQ =
      url.searchParams.get("type") || url.searchParams.get("topic");
    const typeQ = normalizeType(rawTypeQ);
    const idQ = url.searchParams.get("data.id") || url.searchParams.get("id");
    const body = await parseBody(req);
    const rawTypeB = body?.type || (body?.action?.split(".")?.[0] ?? null);
    const typeB = normalizeType(rawTypeB);
    const idB = body?.data?.id
      ? String(body.data.id)
      : body?.id
        ? String(body.id)
        : null;

    const finalType = typeQ || typeB || (idB ? "payment" : "");
    const finalId = idB || idQ || null;

    console.log("[webhook] typeQ/typeB/final:", typeQ, typeB, finalType);
    console.log("[webhook] idQ/idB/final:", idQ, idB, finalId);

    // payment
    if (finalType === "payment" && finalId) {
      try {
        const p = await readPayment(finalId);
        await processPayment(p);
      } catch (e) {
        console.error("[payment] error", e);
        await notify(`❗ error leyendo payment ${finalId}: ${String(e)}`);
      }
      return new Response("ok", { status: 200, headers: cors });
    }

    // merchant_order
    if (finalType === "merchant_order" && finalId) {
      try {
        const mo = await readMerchantOrder(finalId);
        const payments = Array.isArray(mo?.payments) ? mo.payments : [];
        console.log(
          "[merchant_order] payments:",
          payments.map((p: any) => p?.id),
        );
        if (!payments.length)
          await notify(`ℹ️ merchant_order ${finalId} sin payments`);

        for (const p of payments) {
          if (p?.id) {
            try {
              const pay = await readPayment(String(p.id));
              await processPayment(pay);
            } catch (e) {
              console.error("[merchant_order] readPayment error", e);
              await notify(
                `❗ readPayment error order ${finalId}: ${String(e)}`,
              );
            }
          }
        }
      } catch (e) {
        console.error("[merchant_order] error", e);
        await notify(`❗ merchant_order ${finalId} error: ${String(e)}`);
      }
      return new Response("ok", { status: 200, headers: cors });
    }

    // Si no pudimos determinar nada útil, log
    await notify(
      `ℹ️ webhook sin datos útiles. query=${url.search} body=${JSON.stringify(body).slice(0, 300)}`,
    );
    return new Response("ok", { status: 200, headers: cors });
  } catch (e) {
    console.error("[webhook] error inesperado", e);
    await notify(`❗ webhook error inesperado: ${String(e)}`);
    return new Response("ok", { status: 200, headers: cors });
  }
}
