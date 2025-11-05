import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Detectar modo test/producción
const MP_MODE = process.env.MP_MODE || "production";
const isTestMode = MP_MODE === "test";

// Usar credenciales según el modo
const MP_ACCESS_TOKEN = isTestMode 
  ? process.env.MP_ACCESS_TOKEN_TEST! 
  : process.env.MP_ACCESS_TOKEN!;
const MP_WEBHOOK_SECRET = isTestMode
  ? (process.env.MP_WEBHOOK_SECRET_TEST || "")
  : (process.env.MP_WEBHOOK_SECRET || "");

console.log(`[MP create-preference] Modo: ${isTestMode ? '🧪 TEST' : '💰 PRODUCCIÓN'}`);

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
    const { user_id, course_slug, currency = "ARS", months = 12, code } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    console.log('[MP create-preference] Request received:', {
      user_id,
      course_slug,
      currency,
      months,
      hasCouponCode: !!code,
      couponCode: code ? code.trim() : null
    });

    if (!user_id || !course_slug) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(400)
        .json({ ok: false, error: "Faltan user_id o course_slug" });
    }

    // Extract auth token from header for authenticated RPC calls
    // (Required for validate_coupon RPC which uses auth.uid())
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    
    if (!token) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(401)
        .json({ ok: false, error: "Missing authorization token" });
    }
    
    // Create authenticated client for RPC (needed for validate_coupon which uses auth.uid())
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

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

    let unit_price = Number(chosen.amount);
    if (!Number.isFinite(unit_price) || unit_price <= 0) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ ok: false, error: "Precio inválido" });
    }

    let couponData: any = null;

    // Validar cupón si se proporcionó (server-side validation)
    if (code && code.trim()) {
      console.log('[MP create-preference] Validando cupón:', {
        code: code.trim(),
        user_id,
        course_id: course.id,
        price: unit_price,
        currency
      });

      const { data: validationResult, error: couponError } = await supabase.rpc('validate_coupon', {
        p_code: code.trim(),
        p_course_id: course.id,
        p_price: unit_price,
        p_currency: currency
      });

      if (couponError) {
        console.error('[MP create-preference] Error validating coupon:', couponError);
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(400)
          .json({ ok: false, error: "Error validando cupón", details: couponError.message });
      }

      if (!validationResult || !validationResult.ok) {
        console.error('[MP create-preference] Cupón inválido:', {
          code: code.trim(),
          reason: validationResult?.reason,
          validationResult
        });
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(400)
          .json({ 
            ok: false,
            error: "Cupón inválido", 
            reason: validationResult?.reason || 'UNKNOWN'
          });
      }

      // Cupón válido - aplicar descuento
      couponData = validationResult;
      const finalPrice = Number(validationResult.final_price);
      
      // Si el cupón da 100% descuento, el frontend debe usar /api/checkout/free-enroll
      if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(400)
          .json({ 
            ok: false,
            error: "Este cupón otorga acceso gratuito. Usa el flujo de inscripción gratuita.",
            free_enrollment: true,
            coupon_code: code.trim()
          });
      }
      
      unit_price = finalPrice;
      console.log('[MP create-preference] Cupón aplicado:', {
        code: code.trim(),
        discount: validationResult.discount,
        final_price: unit_price
      });
    }

    // Obtener datos del usuario
    const { data: userRow } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user_id)
      .maybeSingle();

    // Usar email real del usuario (no email de prueba)
    const email = userRow?.email;
    
    const fullNameParts = userRow?.full_name?.trim().split(" ") ?? [];
    
    // Asegurar que siempre tengamos first_name y last_name (requerido por MP para mejor aprobación)
    let first_name = fullNameParts[0] || "Usuario";
    let last_name = fullNameParts.length > 1 
      ? fullNameParts.slice(1).join(" ") 
      : "Archub"; // Default si solo tiene un nombre

    // Validar que tengamos un token válido (producción o test)
    const isValidToken = MP_ACCESS_TOKEN && 
      (MP_ACCESS_TOKEN.startsWith("APP_USR-") || MP_ACCESS_TOKEN.startsWith("TEST-"));
    
    if (!isValidToken) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ ok: false, error: "MP_ACCESS_TOKEN no configurado correctamente" });
    }

    // Usar custom_id en base64 (igual que PayPal)
    // SIMPLIFICADO: No enviar info de cupón a MP para evitar rechazo
    const customData: any = {
      user_id,
      course_slug: course.slug,
      months: chosen.months || months,
    };

    // Guardar info del cupón SOLO en metadata (no en external_reference)
    const couponMetadata = couponData ? {
      coupon_code: code.trim().toUpperCase(),
      coupon_id: couponData.coupon_id,
      discount: couponData.discount,
      list_price: chosen.amount,
      final_price: unit_price,
    } : null;

    const custom_id = Buffer.from(JSON.stringify(customData)).toString('base64');

    // Construir la URL base desde el request (para que funcione en Replit y Vercel)
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const requestOrigin = `${protocol}://${host}`;
    
    // Para back_urls (retorno después del pago), usar el origin del request
    const returnBase = requestOrigin;
    
    // Para notification_url (webhook), usar CHECKOUT_RETURN_URL_BASE si está disponible
    // (porque el webhook debe ir al servidor público accesible desde MP)
    const webhookBase = process.env.CHECKOUT_RETURN_URL_BASE || requestOrigin;
    
    const prefBody: any = {
      items: [
        {
          id: course.slug,
          category_id: "services", // Categoría de Mercado Pago para servicios/educación
          title: course.title,
          description: course.short_description || course.title,
          quantity: 1,
          unit_price,
          currency_id: currency,
        },
      ],
      external_reference: custom_id,
      payer: { 
        email, 
        first_name, 
        last_name 
      },
      notification_url: `${webhookBase}/api/mp/webhook?secret=${MP_WEBHOOK_SECRET}`,
      back_urls: {
        success: `${returnBase}/api/mp/success-handler?course_slug=${course.slug}`,
        failure: `${returnBase}/learning/courses/${course.slug}?payment=failed`,
        pending: `${returnBase}/learning/courses/${course.slug}?payment=pending`,
      },
      auto_return: "approved",
      binary_mode: true,
      statement_descriptor: "ARCHUB",
    };

    // SIEMPRE agregar metadata (con o sin cupón)
    // Metadata básica sin mencionar descuentos
    prefBody.metadata = {
      user_id,
      course_slug: course.slug,
      months: chosen.months || months,
    };
    
    // Si hay cupón, guardar info adicional SOLO en metadata (no en external_reference)
    if (couponMetadata) {
      prefBody.metadata.has_discount = true;
      prefBody.metadata.original_price = couponMetadata.list_price;
      prefBody.metadata.coupon_id = couponMetadata.coupon_id;
    }

    console.log("[MP create-preference] Creando preferencia para:", { 
      user_id, 
      course_slug, 
      unit_price, 
      currency,
      hasCoupon: !!couponData,
      couponCode: couponData ? code.trim() : null
    });

    // Log completo del body para debugging
    console.log("[MP create-preference] Body completo enviado a MP:", JSON.stringify(prefBody, null, 2));

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
