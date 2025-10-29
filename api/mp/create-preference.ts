import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return res
      .status(200)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"])
      .setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"])
      .send("ok");
  }

  if (req.method !== "POST") {
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { user_id, course_slug, currency = "ARS", months = 12 } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!user_id || !course_slug) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(400)
        .json({ ok: false, error: "Faltan user_id o course_slug" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener curso
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, slug, short_description, is_active")
      .eq("slug", course_slug)
      .single();

    if (courseError || !course?.is_active) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(404)
        .json({ ok: false, error: "Curso no encontrado o inactivo" });
    }

    // Obtener precio
    const { data: priceRows, error: priceError } = await supabase
      .from("course_prices")
      .select("amount, currency_code, provider, is_active, months")
      .eq("course_id", course.id)
      .eq("currency_code", currency)
      .in("provider", ["mercadopago", "any"])
      .eq("is_active", true);

    if (priceError) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ ok: false, error: "Error leyendo precios", details: priceError });
    }

    const chosen = priceRows?.find((r) => r.provider === "mercadopago") ?? priceRows?.[0];
    if (!chosen) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(400)
        .json({ ok: false, error: "No hay precio activo para ese curso + moneda" });
    }

    const unit_price = Number(chosen.amount);
    if (!Number.isFinite(unit_price) || unit_price <= 0) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ ok: false, error: "Precio inválido" });
    }

    // Obtener datos del usuario
    const { data: userRow } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user_id)
      .maybeSingle();

    const email = userRow?.email;
    const [first_name, ...rest] = userRow?.full_name?.split(" ") ?? [];
    const last_name = rest.join(" ");

    if (!MP_ACCESS_TOKEN || !MP_ACCESS_TOKEN.startsWith("APP_USR-")) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ ok: false, error: "MP_ACCESS_TOKEN no configurado correctamente" });
    }

    // Usar custom_id en base64 (igual que PayPal)
    const customData = {
      user_id,
      course_slug: course.slug,
      months: chosen.months || months,
    };
    const custom_id = Buffer.from(JSON.stringify(customData)).toString('base64');

    const returnBase = process.env.CHECKOUT_RETURN_URL_BASE || "https://sukanec.vercel.app";
    
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
      external_reference: custom_id,
      payer: { email, first_name, last_name },
      notification_url: `${returnBase}/api/mp/webhook?secret=${MP_WEBHOOK_SECRET}`,
      back_urls: {
        success: `${returnBase}/api/mp/success-handler?course_slug=${course.slug}`,
        failure: `${returnBase}/learning/courses/${course.slug}?payment=failed`,
        pending: `${returnBase}/learning/courses/${course.slug}?payment=pending`,
      },
      auto_return: "approved",
      binary_mode: true,
      metadata: customData,
      statement_descriptor: "ARCHUB",
    };

    console.log("[MP create-preference] Creando preferencia para:", { user_id, course_slug, unit_price, currency });

    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prefBody),
    });

    const responseText = await r.text();
    let pref: any;
    try {
      pref = JSON.parse(responseText);
    } catch {
      pref = { raw: responseText };
    }

    if (!r.ok || !pref?.init_point) {
      console.error("[MP create-preference] Error de Mercado Pago:", pref);
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(r.status)
        .json({ ok: false, error: "Error al crear preferencia en Mercado Pago", body: pref });
    }

    console.log("[MP create-preference] ✅ Preferencia creada:", pref.id);

    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(200)
      .json({ ok: true, init_point: pref.init_point, preference_id: pref.id });
  } catch (e: any) {
    console.error("[MP create-preference] Error fatal:", e);
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(500)
      .json({ ok: false, error: e.message || String(e) });
  }
}
