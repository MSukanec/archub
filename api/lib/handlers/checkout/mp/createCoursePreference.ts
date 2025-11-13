import type { VercelRequest } from "@vercel/node";
import { getAuthenticatedClient } from "../shared/auth";
import { validateAndApplyCoupon } from "../shared/coupons";
import { getUserData } from "../shared/user";
import { buildURLContext, buildCourseBackUrls } from "../shared/urls";
import { validateMPToken, logMPMode, MP_WEBHOOK_SECRET } from "./config";
import { encodeCustomData } from "./encoding";
import { createMPPreference } from "./api";

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
    // 5. Obtener curso
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, slug, short_description, is_active")
      .eq("slug", course_slug)
      .single();

    if (courseError || !course?.is_active) {
      return { success: false, error: "Curso no encontrado o inactivo", status: 404 };
    }

    // 6. Obtener precio
    const { data: priceRows, error: priceError } = await supabase
      .from("course_prices")
      .select("amount, currency_code, provider, is_active, months")
      .eq("course_id", course.id)
      .eq("currency_code", currency)
      .in("provider", ["mercadopago", "any"])
      .eq("is_active", true);

    if (priceError) {
      return { success: false, error: "Error leyendo precios", status: 500 };
    }

    const chosen = priceRows?.find((r) => r.provider === "mercadopago") ?? priceRows?.[0];
    if (!chosen) {
      return { success: false, error: "No hay precio activo para ese curso + moneda", status: 400 };
    }

    let unit_price = Number(chosen.amount);
    if (!Number.isFinite(unit_price) || unit_price <= 0) {
      return { success: false, error: "Precio inválido", status: 500 };
    }

    const productId = course.id;
    const productTitle = course.title;
    const productSlug = course.slug;
    const productDescription = course.short_description || course.title;
    const accessMonths = chosen.months || months;
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
