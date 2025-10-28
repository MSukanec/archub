// /api/mp/create-preference.ts
export const config = { runtime: "nodejs", regions: ["gru1"] }; // usa la región de tu Supabase

import { env } from "../_lib/env";
import { json, handlePreflight } from "../_lib/cors";
import { supabaseAdmin } from "../_lib/supabase-admin";

export default async function handler(req: Request) {
  const pre = handlePreflight(req);
  if (pre) return pre;

  try {
    if (req.method !== "POST")
      return json({ error: "Method not allowed" }, 405);

    const payload = await req.json().catch(() => ({}));
    const {
      user_id,
      course_slug,
      currency = "ARS",
      months = null,
    } = payload ?? {};

    // --- Validaciones básicas
    if (!user_id || !course_slug) {
      return json({ error: "Faltan user_id o course_slug" }, 400);
    }

    // --- Curso (activo)
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

    // --- Precio desde course_prices
    // Prioridad: provider = 'mercadopago' -> 'any', ambos activos y con la currency pedida
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

    // --- Payer (opcional)
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

    // --- Credenciales MP + Secret
    if (!env.MP_ACCESS_TOKEN || env.MP_ACCESS_TOKEN.startsWith("TEST-")) {
      return json(
        { error: "MP_ACCESS_TOKEN no productivo (APP_USR-...)" },
        500,
      );
    }
    if (!env.MP_WEBHOOK_SECRET) {
      return json({ error: "Falta MP_WEBHOOK_SECRET en env" }, 500);
    }
    if (!env.CHECKOUT_RETURN_URL_BASE) {
      return json({ error: "Falta CHECKOUT_RETURN_URL_BASE en env" }, 500);
    }

    // --- external_reference = user|slug|months
    const external_reference = [user_id, course.slug, months ?? "null"].join(
      "|",
    );

    // --- URL base del sitio (para back_urls) y de la API (para webhook)
    const origin = new URL(req.url).origin;

    // --- Construcción de preferencia
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
      notification_url: `${origin}/api/mp/webhook?secret=${env.MP_WEBHOOK_SECRET}&source_news=webhooks`,
      back_urls: {
        success: `${env.CHECKOUT_RETURN_URL_BASE}?course=${course.slug}`,
        failure: `${env.CHECKOUT_RETURN_URL_BASE}?course=${course.slug}`,
        pending: `${env.CHECKOUT_RETURN_URL_BASE}?course=${course.slug}`,
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

    // --- Llamada a Mercado Pago
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prefBody),
    });

    const mpText = await r.text();
    let pref: any = null;
    try {
      pref = JSON.parse(mpText);
    } catch {}

    if (!r.ok || !pref?.init_point) {
      return json(
        {
          error: "mp_error",
          status: r.status,
          sent: prefBody,
          body: pref ?? mpText,
        },
        500,
      );
    }

    return json({ init_point: pref.init_point });
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
}
