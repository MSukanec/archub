import type { Request } from "express";
import { nanoid } from "nanoid";
import { getAuthenticatedClient } from "../shared/auth.js";
import { validateAndApplyCoupon } from "../shared/coupons.js";
import { getUserData } from "../shared/user.js";
import { buildURLContext, buildCourseBackUrls } from "../shared/urls.js";
import { validateMPToken, logMPMode, MP_WEBHOOK_SECRET, isTestMode } from "./config.js";
import { encodeCustomData } from "./encoding.js";
import { createMPPreference } from "./api.js";

export type CreateCoursePreferenceResult =
  | { success: true; initPoint: string; preferenceId: string }
  | { success: false; error: string; status?: number; reason?: string; freeEnrollment?: boolean; couponCode?: string };

export async function createCoursePreference(req: Request): Promise<CreateCoursePreferenceResult> {
  logMPMode("create-course-preference");

  // 1. Parse body
  const { 
    course_slug, 
    currency = "ARS", 
    months = 12, 
    code 
  } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  // 2. Validate inputs
  if (!course_slug) {
    return { success: false, error: "Falta course_slug", status: 400 };
  }

  // 3. Get authenticated client
  const authResult = getAuthenticatedClient(req);
  if (!authResult.success) {
    return { success: false, error: authResult.error, status: 401 };
  }

  const { supabase } = authResult;

  // 4. SECURITY: Derive user_id from authenticated session, NOT from request body
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('[MP create-course-preference] Auth error:', userError);
    return { success: false, error: "Authentication failed", status: 401 };
  }

  const user_id = user.id;

  console.log('[MP create-course-preference] Request received:', {
    user_id,
    course_slug,
    currency,
    months,
    hasCouponCode: !!code,
    couponCode: code ? code.trim() : null
  });

  try {
    // 5. Obtener curso y precio en USD (con student_price si disponible)
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, slug, short_description, is_active, price, student_price")
      .eq("slug", course_slug)
      .single();

    if (courseError || !course?.is_active) {
      return { success: false, error: "Curso no encontrado o inactivo", status: 404 };
    }

    // 6. Obtener precio base en USD y convertir a ARS
    // --- NUEVA LÓGICA: Si hay cupón, usar student_price ---
    let basePriceUsd = Number(course.price);
    
    if (!Number.isFinite(basePriceUsd) || basePriceUsd <= 0) {
      console.error('[MP create-course-preference] Invalid price:', course.price);
      return { success: false, error: "Precio inválido", status: 500 };
    }

    let unit_price = basePriceUsd;
    let couponData: any = null;

    // 7. Validar cupón si se proporcionó - SOLO PARA VALIDAR, no para calcular descuento
    if (code && code.trim()) {
      const { data: validationResult, error: couponError } = await supabase.rpc('validate_coupon', {
        p_code: code.trim(),
        p_course_id: course.id,
        p_price: basePriceUsd,
        p_currency: currency
      });

      if (couponError || !validationResult?.ok) {
        console.error('[MP create-course-preference] Cupón inválido:', validationResult?.reason || couponError?.message);
        return { 
          success: false, 
          error: validationResult?.reason || "Cupón inválido", 
          status: 400
        };
      }

      // ✅ Cupón válido. Ahora usamos student_price si existe
      if (course.student_price && Number(course.student_price) > 0) {
        unit_price = Number(course.student_price);
        couponData = validationResult;
        console.log('[MP create-course-preference] ✅ Cupón válido - Usando student_price:', {
          code: code.trim(),
          student_price_usd: unit_price,
          original_price_usd: basePriceUsd
        });
      } else {
        // Si no hay student_price, usar el cálculo original del RPC
        unit_price = Number(validationResult.final_price);
        couponData = validationResult;
        console.log('[MP create-course-preference] ✅ Cupón válido - Usando RPC final_price:', {
          code: code.trim(),
          final_price_usd: unit_price
        });
      }
    }

    // Convertir a ARS si es necesario
    if (currency === 'ARS') {
      const { data: exchangeRate, error: exchangeError } = await supabase
        .from("exchange_rates")
        .select("rate")
        .eq("from_currency", "USD")
        .eq("to_currency", "ARS")
        .eq("is_active", true)
        .single();

      if (exchangeError || !exchangeRate) {
        console.error('[MP create-course-preference] Exchange rate not found:', exchangeError);
        return { success: false, error: "Tasa de cambio no disponible", status: 500 };
      }

      // ✅ VALIDACIÓN FÉRREA PRE-CÁLCULO
      const rate = Number(exchangeRate.rate);
      
      // Verificar que unit_price sea un número válido
      if (!Number.isFinite(unit_price)) {
        console.error('🚨 ERROR FATAL: unit_price no es un número válido:', unit_price, 'Tipo:', typeof unit_price);
        return { success: false, error: "Error interno: Precio calculado inválido.", status: 500 };
      }

      // Verificar que la tasa de cambio sea un número válido
      if (!Number.isFinite(rate)) {
        console.error('🚨 ERROR FATAL: exchangeRate.rate no es un número válido:', exchangeRate.rate, 'Tipo:', typeof rate);
        return { success: false, error: "Tasa de cambio no disponible o inválida", status: 500 };
      }

      // 🔍 DEBUG PRE-CÁLCULO ARS
      console.log('🔍 DEBUG PRE-CÁLCULO ARS:', {
        usdPrice: unit_price,
        rate: rate,
        usdPriceIsFinite: Number.isFinite(unit_price),
        rateIsFinite: Number.isFinite(rate)
      });

      // Cálculo seguro
      const rawArsPrice = unit_price * rate;

      // 🔍 DEBUG POST-CÁLCULO
      console.log('🔍 DEBUG POST-CÁLCULO:', {
        rawArsPrice,
        isFinite: Number.isFinite(rawArsPrice)
      });

      unit_price = Math.round(rawArsPrice);

      console.log('[MP create-course-preference] Price converted to ARS:', {
        usd_price: unit_price,
        exchange_rate: rate,
        raw_ars_price: rawArsPrice,
        final_ars_price: unit_price
      });
    } else {
      // Si es USD, validar que sea un número válido
      if (!Number.isFinite(unit_price)) {
        console.error('🚨 ERROR FATAL: unit_price USD no es un número válido:', unit_price);
        return { success: false, error: "Error interno: Precio del curso inválido.", status: 500 };
      }
    }

    const productId = course.id;
    const productTitle = course.title;
    const productSlug = course.slug;
    const productDescription = course.short_description || course.title;
    const accessMonths = months;

    // 8. Obtener datos del usuario
    const userData = await getUserData(supabase, user_id);

    // 9. Validar token
    const tokenValidation = validateMPToken();
    if (!tokenValidation.valid) {
      return { success: false, error: tokenValidation.error, status: 500 };
    }

    // 10. Construir customData
    const customData: any = {
      user_id,
      product_type: 'course',
      course_slug,
      months: accessMonths,
    };

    if (couponData) {
      customData.coupon_code = code.trim().toUpperCase();
      customData.coupon_id = couponData.coupon_id;
    }

    const custom_id = encodeCustomData(customData);

    // 11. Construir URLs
    const urlContext = buildURLContext(req);
    const backUrls = buildCourseBackUrls(urlContext.returnBase, productSlug, "mp");

    // --- VALIDACIÓN FINAL DEL PRECIO ---
    unit_price = Number(unit_price);
    
    if (!Number.isFinite(unit_price) || unit_price <= 0) {
      console.error('🚨 ERROR: El precio final es inválido:', unit_price);
      return { success: false, error: "Error al calcular el precio final.", status: 400 };
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
        email: userData.email,
        first_name: userData.firstName || "Comprador", 
        last_name: userData.lastName || "Curso" 
      },
      notification_url: `${urlContext.webhookBase}/api/checkout/mp/webhook?secret=${MP_WEBHOOK_SECRET}`,
      back_urls: backUrls,
      auto_return: "approved",
      binary_mode: true,
      statement_descriptor: "SEENCEL",
      metadata: {
        user_id,
        product_type: 'course',
        course_slug,
        months: accessMonths,
        ...(couponData && {
          coupon_code: code.trim().toUpperCase(),
          coupon_id: couponData.coupon_id,
        }),
      }
    };

    console.log("[MP create-course-preference] Creando preferencia para:", { 
      user_id, 
      productSlug,
      unit_price, 
      currency,
      hasCoupon: !!couponData,
      couponCode: couponData ? code.trim() : null
    });

    // 🔍 LOG DEL JSON COMPLETO PARA MP (sin tokens sensibles)
    const debugPrefBody = {
      items: prefBody.items,
      external_reference: prefBody.external_reference,
      payer: prefBody.payer,
      back_urls: prefBody.back_urls,
      auto_return: prefBody.auto_return,
      binary_mode: prefBody.binary_mode,
      statement_descriptor: prefBody.statement_descriptor,
      metadata: prefBody.metadata
    };
    console.log("[MP DEBUG] JSON Preferencia a enviar:", JSON.stringify(debugPrefBody, null, 2));

    // 12. Create MP preference
    const result = await createMPPreference(prefBody);

    if (!result.success) {
      console.error("[MP create-course-preference] Error de Mercado Pago:", result.body);
      return { success: false, error: result.error, status: result.status };
    }

    console.log("[MP create-course-preference] ✅ Preferencia creada:", result.preferenceId);

    return { 
      success: true, 
      initPoint: result.initPoint, 
      preferenceId: result.preferenceId 
    };
  } catch (e: any) {
    console.error("[MP create-course-preference] Error fatal:", e);
    return { success: false, error: e.message || String(e), status: 500 };
  }
}
