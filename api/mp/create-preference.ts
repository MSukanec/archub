// /api/mp/create-preference.ts
export const config = { runtime: "nodejs", regions: ["gru1"] };

import { json, handlePreflight } from "../_lib/cors";
import { supabaseAdmin } from "../_lib/supabase-admin";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const ENV = {
  SUPABASE_URL: must("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: must("SUPABASE_SERVICE_ROLE_KEY"),
  MP_ACCESS_TOKEN: must("MP_ACCESS_TOKEN"), // Debe empezar con APP_USR-
  MP_WEBHOOK_SECRET: must("MP_WEBHOOK_SECRET"),
  CHECKOUT_RETURN_URL_BASE: must("CHECKOUT_RETURN_URL_BASE"),
};

export default async function handler(req: Request) {
  const pre = handlePreflight(req);
  if (pre) return pre;

  try {
    if (req.method !== "POST")
      return json({ error: "Method not allowed" }, 405);

    const body = await req.json().catch(() => ({}) as any);
    const {
      user_id,
      course_slug,
      currency = "ARS",
      months: monthsRaw = null, // opcional desde el front
    } = body ?? {};

    // 🔒 Validaciones básicas
    if (!user_id || !course_slug) {
      return json({ error: "Faltan user_id o course_slug" }, 400);
    }

    // 📚 Curso activo
    const { data: course, error: eCourse } = await supabaseAdmin
      .from("courses")
      .select("id, title, slug, short_description, is_active")
      .eq("slug", course_slug)
      .maybeSingle();

    if (eCourse || !course || course.is_active !== true) {
      return json(
        { error: "Curso no encontrado o inactivo", details: eCourse || null },
        400,
      );
    }

    // 🗓️ Duración (meses). Si no viene, por ahora tomamos 12 como default.
    const months =
      Number.isFinite(Number(monthsRaw)) && Number(monthsRaw) > 0
        ? Number(monthsRaw)
        : 12;

    // 💵 Precio en course_prices (provider 'mercadopago' o 'any')
    const { data: priceRows, error: ePrice } = await supabaseAdmin
      .from("course_prices")
      .select("amount, currency_code, provider, is_active")
      .eq("course_id", course.id)
      .eq("currency_code", String(currency).toUpperCase())
      .in("provider", ["mercadopago", "any"])
      .eq("is_active", true);

    if (ePrice)
      return json({ error: "Error leyendo precios", details: ePrice }, 500);

    const chosen =
      priceRows?.find((r) => r.provider === "mercadopago") ??
      priceRows?.find((r) => r.provider === "any") ??
      null;

    if (!chosen) {
      return json(
        {
          error: "No hay precio activo para ese curso + moneda",
          details: { course_id: course.id, currency },
        },
        400,
      );
    }

    const unit_price = Number(chosen.amount);
    if (!Number.isFinite(unit_price) || unit_price <= 0) {
      return json(
        {
          error: "Precio inválido en course_prices",
          details: { amount: chosen.amount },
        },
        500,
      );
    }

    // 👤 Payer (opcional)
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("email, full_name")
      .eq("id", user_id)
      .maybeSingle();

    const email = userRow?.email || undefined;
    let first_name: string | undefined;
    let last_name: string | undefined;
    if (userRow?.full_name) {
      const [f, ...rest] = userRow.full_name.trim().split(/\s+/);
      first_name = f;
      last_name = rest.join(" ") || undefined;
    }

    // 🔑 Chequeos MP
    if (!ENV.MP_ACCESS_TOKEN || ENV.MP_ACCESS_TOKEN.startsWith("TEST-")) {
      return json(
        { error: "MP_ACCESS_TOKEN no productivo (debe ser APP_USR-...)" },
        500,
      );
    }

    // 📦 external_reference y metadata
    const external_reference = [user_id, course.slug, months ?? "null"].join(
      "|",
    );
    const origin = new URL(req.url).origin;

    const prefBody = {
      items: [
        {
          id: course.slug,
          title: course.title,
          description: course.short_description || "",
          category_id: "services",
          quantity: 1,
          unit_price,
          currency_id: String(chosen.currency_code || currency).toUpperCase(),
        },
      ],
      external_reference,
      payer: { email, first_name, last_name },
      notification_url: `${origin}/api/mp/webhook?secret=${ENV.MP_WEBHOOK_SECRET}&source_news=webhooks`,
      back_urls: {
        success: `${ENV.CHECKOUT_RETURN_URL_BASE}?course=${course.slug}`,
        failure: `${ENV.CHECKOUT_RETURN_URL_BASE}?course=${course.slug}`,
        pending: `${ENV.CHECKOUT_RETURN_URL_BASE}?course=${course.slug}`,
      },
      auto_return: "approved",
      binary_mode: true,
      metadata: {
        user_id,
        course_slug: course.slug,
        months,
        provider: chosen.provider,
      },
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
    let pref: any = null;
    try {
      pref = JSON.parse(raw);
    } catch {}

    if (!r.ok || !pref?.init_point) {
      return json(
        {
          error: "mp_error",
          status: r.status,
          sent: prefBody,
          body: pref ?? raw,
        },
        500,
      );
    }

    return json({ init_point: pref.init_point });
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
}
