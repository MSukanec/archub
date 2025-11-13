import { SupabaseClient } from "@supabase/supabase-js";

export type CouponValidationResult = 
  | { success: true; finalPrice: number; couponData: any }
  | { success: false; error: string; reason?: string; freeEnrollment?: boolean };

export async function markCouponAsUsed(
  supabase: SupabaseClient,
  couponId: string,
  userId: string,
  courseId: string,
  orderId: string,
  amountSaved: number,
  currency: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[coupons] Redeeming coupon via RPC:', {
    coupon_id: couponId,
    user_id: userId,
    course_id: courseId,
    order_id: orderId
  });

  // Use the existing redeem_coupon RPC function which:
  // 1. Inserts into coupon_redemptions (audit trail)
  // 2. Increments used_count
  // This is idempotent-safe because we only call it when payment is NEWLY inserted
  const { data, error } = await supabase.rpc('redeem_coupon', {
    p_coupon_id: couponId,
    p_user_id: userId,
    p_course_id: courseId,
    p_order_id: orderId,
    p_amount_saved: amountSaved,
    p_currency: currency
  });

  if (error) {
    console.error('[coupons] Error redeeming coupon:', error);
    return { success: false, error: error.message };
  }

  console.log('[coupons] ✅ Coupon redeemed successfully');
  return { success: true };
}

export async function validateAndApplyCoupon(
  supabase: SupabaseClient,
  code: string,
  courseId: string,
  originalPrice: number,
  currency: string,
  userId: string
): Promise<CouponValidationResult> {
  console.log('[coupons] Validando cupón:', {
    code: code.trim(),
    user_id: userId,
    course_id: courseId,
    price: originalPrice,
    currency
  });

  const { data: validationResult, error: couponError } = await supabase.rpc('validate_coupon', {
    p_code: code.trim(),
    p_course_id: courseId,
    p_price: originalPrice,
    p_currency: currency
  });

  if (couponError) {
    console.error('[coupons] Error validating coupon:', couponError);
    return { 
      success: false, 
      error: "Error validando cupón",
      reason: couponError.message 
    };
  }

  if (!validationResult || !validationResult.ok) {
    console.error('[coupons] Cupón inválido:', {
      code: code.trim(),
      reason: validationResult?.reason,
      validationResult
    });
    return { 
      success: false,
      error: "Cupón inválido", 
      reason: validationResult?.reason || 'UNKNOWN'
    };
  }

  const finalPrice = Number(validationResult.final_price);
  
  if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
    return { 
      success: false,
      error: "Este cupón otorga acceso gratuito. Usa el flujo de inscripción gratuita.",
      freeEnrollment: true
    };
  }
  
  console.log('[coupons] Cupón aplicado:', {
    code: code.trim(),
    discount: validationResult.discount,
    final_price: finalPrice
  });

  return { 
    success: true, 
    finalPrice,
    couponData: validationResult
  };
}
