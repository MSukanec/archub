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
    const { 
      user_id, 
      product_type = 'course',
      course_slug, 
      plan_slug,
      organization_id,
      billing_period,
      currency = "ARS", 
      months = 12, 
      code 
    } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    console.log('[MP create-preference] Request received:', {
      user_id,
      product_type,
      course_slug,
      plan_slug,
      organization_id,
      billing_period,
      currency,
      months,
      hasCouponCode: !!code,
      couponCode: code ? code.trim() : null
    });

    // Validar parámetros según tipo de producto
    if (!user_id) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(400)
        .json({ ok: false, error: "Falta user_id" });
    }

    if (product_type === 'subscription') {
      if (!plan_slug || !organization_id || !billing_period) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(400)
          .json({ ok: false, error: "Para suscripciones se requiere plan_slug, organization_id y billing_period" });
      }
    } else {
      if (!course_slug) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(400)
          .json({ ok: false, error: "Falta course_slug" });
      }
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
    
    // Create authenticated client for RPC (needed for validate_coupon RPC which uses auth.uid())
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    let productId: string;
    let productTitle: string;
    let productSlug: string;
    let productDescription: string;
    let unit_price: number;
    let accessMonths: number;
    let couponData: any = null;

    // ==================== FLUJO PARA SUSCRIPCIONES ====================
    if (product_type === 'subscription') {
      console.log('[MP create-preference] Processing subscription...');

      // CRÍTICO: Verificar que el usuario pertenece a la organización y es admin
      const { data: membership, error: memberError } = await supabase
        .from("organization_members")
        .select("id, role_id, roles!inner(name)")
        .eq("organization_id", organization_id)
        .eq("user_id", user_id)
        .eq("is_active", true)
        .single();

      if (memberError || !membership) {
        console.error('[MP create-preference] User not member of organization:', memberError);
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(403)
          .json({ ok: false, error: "No tienes permisos para modificar esta organización" });
      }

      // Verificar que es admin
      const roleName = (membership.roles as any)?.name?.toLowerCase();
      if (roleName !== 'admin' && roleName !== 'owner') {
        console.error('[MP create-preference] User is not admin:', { roleName });
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(403)
          .json({ ok: false, error: "Solo los administradores pueden upgradear el plan de la organización" });
      }

      // Obtener plan con precios directos
      const { data: plan, error: planError } = await supabase
        .from("plans")
        .select("id, name, slug, is_active, monthly_amount, annual_amount")
        .eq("slug", plan_slug)
        .eq("is_active", true)
        .single();

      if (planError || !plan) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(404)
          .json({ ok: false, error: "Plan no encontrado o inactivo" });
      }

      // Obtener precio base en USD desde la tabla plans
      const baseAmountUSD = billing_period === 'monthly' 
        ? parseFloat(plan.monthly_amount) 
        : parseFloat(plan.annual_amount);

      if (!Number.isFinite(baseAmountUSD) || baseAmountUSD <= 0) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(500)
          .json({ ok: false, error: "Precio inválido en el plan" });
      }

      // Si la moneda es ARS, obtener el tipo de cambio
      let finalAmount = baseAmountUSD;
      if (currency === 'ARS') {
        const { data: exchangeRate, error: rateError } = await supabase
          .from("exchange_rates")
          .select("rate")
          .eq("from_currency", "USD")
          .eq("to_currency", "ARS")
          .eq("is_active", true)
          .single();

        if (rateError || !exchangeRate) {
          console.error('[MP create-preference] Error loading exchange rate:', rateError);
          return res
            .setHeader("Access-Control-Allow-Origin", "*")
            .status(500)
            .json({ ok: false, error: "No se pudo obtener el tipo de cambio USD/ARS" });
        }

        const rate = parseFloat(exchangeRate.rate);
        finalAmount = baseAmountUSD * rate;
        
        console.log('[MP create-preference] Conversión USD a ARS:', {
          baseAmountUSD,
          rate,
          finalAmountARS: finalAmount
        });
      }

      unit_price = Number(finalAmount);
      if (!Number.isFinite(unit_price) || unit_price <= 0) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(500)
          .json({ ok: false, error: "Precio inválido después de conversión" });
      }

      productId = plan.id;
      productTitle = `Plan ${plan.name} - ${billing_period === 'monthly' ? 'Mensual' : 'Anual'}`;
      productSlug = plan_slug;
      productDescription = `Suscripción ${billing_period === 'monthly' ? 'mensual' : 'anual'} al plan ${plan.name}`;
      accessMonths = billing_period === 'monthly' ? 1 : 12;

      // NO hay cupones para suscripciones en el MVP
      if (code && code.trim()) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(400)
          .json({ ok: false, error: "Los cupones no están disponibles para suscripciones en este momento" });
      }

    // ==================== FLUJO PARA CURSOS (EXISTENTE) ====================
    } else {
      console.log('[MP create-preference] Processing course...');

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

      unit_price = Number(chosen.amount);
      if (!Number.isFinite(unit_price) || unit_price <= 0) {
        return res
          .setHeader("Access-Control-Allow-Origin", "*")
          .status(500)
          .json({ ok: false, error: "Precio inválido" });
      }

      productId = course.id;
      productTitle = course.title;
      productSlug = course.slug;
      productDescription = course.short_description || course.title;
      accessMonths = chosen.months || months;

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
      : "Seencel"; // Default si solo tiene un nombre

    // Validar que tengamos un token válido (producción o test)
    const isValidToken = MP_ACCESS_TOKEN && 
      (MP_ACCESS_TOKEN.startsWith("APP_USR-") || MP_ACCESS_TOKEN.startsWith("TEST-"));
    
    if (!isValidToken) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ ok: false, error: "MP_ACCESS_TOKEN no configurado correctamente" });
    }

    // Construir customData según tipo de producto
    const customData: any = {
      user_id,
      product_type,
    };

    if (product_type === 'subscription') {
      customData.plan_slug = plan_slug;
      customData.organization_id = organization_id;
      customData.billing_period = billing_period;
    } else {
      customData.course_slug = course_slug;
      customData.months = accessMonths;
      if (couponData) {
        customData.coupon_code = code.trim().toUpperCase();
        customData.coupon_id = couponData.coupon_id;
      }
    }

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
    
    // Construir back_urls según tipo de producto
    let backUrls: any;
    if (product_type === 'subscription') {
      backUrls = {
        success: `${returnBase}/organization/billing?payment=success`,
        failure: `${returnBase}/organization/billing?payment=failed`,
        pending: `${returnBase}/organization/billing?payment=pending`,
      };
    } else {
      backUrls = {
        success: `${returnBase}/api/mp/success-handler?course_slug=${productSlug}`,
        failure: `${returnBase}/learning/courses/${productSlug}?payment=failed`,
        pending: `${returnBase}/learning/courses/${productSlug}?payment=pending`,
      };
    }

    const prefBody: any = {
      items: [
        {
          id: productSlug,
          category_id: "services",
          title: productTitle,
          description: productDescription,
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
      back_urls: backUrls,
      auto_return: "approved",
      binary_mode: true,
      statement_descriptor: "SEENCEL",
    };

    // Construir metadata según tipo de producto
    if (product_type === 'subscription') {
      prefBody.metadata = {
        user_id,
        product_type,
        plan_slug,
        organization_id,
        billing_period,
      };
    } else {
      prefBody.metadata = {
        user_id,
        product_type,
        course_slug,
        months: accessMonths,
      };
    }
    
    // Info del cupón se guardará en external_reference (base64) solo para nuestro webhook
    // MP no puede leerlo porque está encodeado

    console.log("[MP create-preference] Creando preferencia para:", { 
      user_id, 
      product_type,
      productSlug,
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
