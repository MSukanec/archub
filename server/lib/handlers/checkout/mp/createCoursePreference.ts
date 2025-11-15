import type { VercelRequest } from "@vercel/node";
import { getAuthenticatedClient } from "../shared/auth.js";
import { validateAndApplyCoupon } from "../shared/coupons.js";
import { getUserData } from "../shared/user.js";
import { buildURLContext, buildCourseBackUrls } from "../shared/urls.js";
import { validateMPToken, logMPMode, MP_WEBHOOK_SECRET } from "./config.js";
import { encodeCustomData } from "./encoding.js";
import { createMPPreference } from "./api.js";

export type CreateCoursePreferenceResult =
  | { success: true; initPoint: string; preferenceId: string }
  | { success: false; error: string; status?: number; reason?: string; freeEnrollment?: boolean; couponCode?: string };

export async function createCoursePreference(req: VercelRequest): Promise<CreateCoursePreferenceResult> {
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
    // 5. Obtener curso y precio en USD
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, slug, short_description, is_active, price")
      .eq("slug", course_slug)
      .single();

    if (courseError || !course?.is_active) {
      return { success: false, error: "Curso no encontrado o inactivo", status: 404 };
    }

    // 6. Obtener precio base en USD y convertir a ARS
    let unit_price = Number(course.price);
    
    if (!Number.isFinite(unit_price) || unit_price <= 0) {
      console.error('[MP create-course-preference] Invalid price:', course.price);
      return { success: false, error: "Precio inválido", status: 500 };
    }

    // Si la moneda es ARS, convertir usando exchange_rates
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

      unit_price = unit_price * Number(exchangeRate.rate);
      console.log('[MP create-course-preference] Price converted:', {
        usd_price: course.price,
        exchange_rate: exchangeRate.rate,
        ars_price: unit_price
      });
    }

    const productId = course.id;
    const productTitle = course.title;
    const productSlug = course.slug;
    const productDescription = course.short_description || course.title;
    const accessMonths = months;
    let couponData: any = null;

    // 7. Validar cupón si se proporcionó
    if (code && code.trim()) {
      const couponResult = await validateAndApplyCoupon(
        supabase,
        code.trim(),
        course.id,
        unit_price,
        currency,
        user_id
      );

      if (!couponResult.success) {
        if (couponResult.freeEnrollment) {
          return { 
            success: false,
            error: "Este cupón otorga acceso gratuito. Usa el flujo de inscripción gratuita.",
            status: 400,
            freeEnrollment: true,
            couponCode: code.trim()
          };
        }
        return { 
          success: false, 
          error: couponResult.error, 
          status: 400,
          reason: couponResult.reason
        };
      }

      couponData = couponResult.couponData;
      unit_price = couponResult.finalPrice;
      console.log('[MP create-course-preference] Cupón aplicado:', {
        code: code.trim(),
        discount: couponData.discount,
        final_price: unit_price
      });
    }

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
        first_name: userData.firstName, 
        last_name: userData.lastName 
      },
      notification_url: `${urlContext.webhookBase}/api/mp/webhook?secret=${MP_WEBHOOK_SECRET}`,
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
