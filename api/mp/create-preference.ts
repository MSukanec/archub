// /api/mp/create-preference.ts
export const config = { runtime: "nodejs", regions: ["gru1"] };

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Content-Type": "application/json",
    },
  });
}

function handlePreflight(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  return null;
}

import { createClient } from "@supabase/supabase-js";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const ENV = {
  SUPABASE_URL: must("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: must("SUPABASE_SERVICE_ROLE_KEY"),
  MP_ACCESS_TOKEN: must("MP_ACCESS_TOKEN"),
  MP_WEBHOOK_SECRET: must("MP_WEBHOOK_SECRET"),
  CHECKOUT_RETURN_URL_BASE: must("CHECKOUT_RETURN_URL_BASE"),
};

const supabaseAdmin = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY,
);

export default async function handler(req: Request) {
  const pre = handlePreflight(req);
  if (pre) return pre;

  try {
    if (req.method !== "POST")
      return json({ error: "Method not allowed" }, 405);

    const {
      user_id,
      course_slug,
      currency = "ARS",
      months = 12,
    } = await req.json();

    if (!user_id || !course_slug)
      return json({ error: "Faltan user_id o course_slug" }, 400);

    const { data: course, error: eCourse } = await supabaseAdmin
      .from("courses")
      .select("id, title, slug, short_description, is_active")
      .eq("slug", course_slug)
      .maybeSingle();

    if (eCourse || !course?.is_active)
      return json({ error: "Curso no encontrado o inactivo" }, 400);

    const { data: priceRows, error: ePrice } = await supabaseAdmin
      .from("course_prices")
      .select("amount, currency_code, provider, is_active")
      .eq("course_id", course.id)
      .eq("currency_code", currency)
      .in("provider", ["mercadopago", "any"])
      .eq("is_active", true);

    if (ePrice)
      return json({ error: "Error leyendo precios", details: ePrice }, 500);

    const chosen =
      priceRows?.find((r) => r.provider === "mercadopago") ?? priceRows?.[0];
    if (!chosen)
      return json(
        { error: "No hay precio activo para ese curso + moneda" },
        400,
      );

    const unit_price = Number(chosen.amount);
    if (!Number.isFinite(unit_price) || unit_price <= 0)
      return json({ error: "Precio inválido" }, 500);

    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("email, full_name")
      .eq("id", user_id)
      .maybeSingle();

    const email = userRow?.email;
    const [first_name, ...rest] = userRow?.full_name?.split(" ") ?? [];
    const last_name = rest.join(" ");

    if (!ENV.MP_ACCESS_TOKEN.startsWith("APP_USR-"))
      return json({ error: "MP_ACCESS_TOKEN no productivo" }, 500);

    const external_reference = [user_id, course.slug, months].join("|");
    const origin = new URL(req.url).origin;

    const prefBody = {
      items: [
        {
          id: course.slug,
          title: course.title,
          description: course.short_description || "",
          quantity: 1,
          unit_price,
          currency_id: currency,
        },
      ],
      external_reference,
      payer: { email, first_name, last_name },
      notification_url: `${origin}/api/mp/webhook?secret=${ENV.MP_WEBHOOK_SECRET}`,
      back_urls: {
        success: `${ENV.CHECKOUT_RETURN_URL_BASE}?course=${course.slug}`,
        failure: `${ENV.CHECKOUT_RETURN_URL_BASE}?course=${course.slug}`,
      },
      auto_return: "approved",
      binary_mode: true,
      metadata: { user_id, course_slug: course.slug, months },
      statement_descriptor: "ARCHUB",
    };

    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prefBody),
    });

    const raw = await r.text();
    let pref: any;
    try {
      pref = JSON.parse(raw);
    } catch {
      pref = { raw };
    }

    if (!r.ok || !pref?.init_point)
      return json({ error: "MP error", body: pref }, 500);

    return json({ init_point: pref.init_point });
  } catch (e: any) {
    return json({ error: e.message || String(e) }, 500);
  }
}
