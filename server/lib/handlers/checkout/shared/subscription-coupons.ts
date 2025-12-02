import { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionCouponValidationResult = 
  | { 
      success: true; 
      finalPrice: number; 
      couponData: {
        coupon_id: string;
        coupon_code: string;
        type: 'percentage' | 'fixed';
        amount: number;
        discount: number;
        is_free: boolean;
      };
    }
  | { 
      success: false; 
      error: string; 
      reason?: string;
      freeSubscription?: boolean;
    };

/**
 * Validates a coupon for subscription checkout
 * Returns the final price after discount or marks as free
 */
export async function validateSubscriptionCoupon(
  supabase: SupabaseClient,
  code: string,
  planId: string,
  originalPrice: number,
  currency: string
): Promise<SubscriptionCouponValidationResult> {
  console.log('[subscription-coupons] Validating coupon:', { code, planId, originalPrice, currency });

  const { data: validationResult, error: couponError } = await supabase.rpc(
    'validate_subscription_coupon', 
    {
      p_code: code.trim(),
      p_plan_id: planId,
      p_price: originalPrice,
      p_currency: currency
    }
  );

  if (couponError) {
    console.error('[subscription-coupons] Error validating coupon:', couponError);
    return { 
      success: false, 
      error: "Error validando cupón",
      reason: couponError.message 
    };
  }

  if (!validationResult || !validationResult.ok) {
    const reasonMap: Record<string, string> = {
      'COUPON_NOT_FOUND': 'Cupón no válido o expirado',
      'PLAN_NOT_ELIGIBLE': 'Este cupón no aplica para este plan',
      'MAX_REDEMPTIONS_REACHED': 'Este cupón alcanzó su límite de usos',
      'CURRENCY_MISMATCH': 'Este cupón no aplica para esta moneda',
      'MIN_ORDER_NOT_MET': 'El precio no alcanza el mínimo requerido',
    };

    const reason = validationResult?.reason || 'UNKNOWN';
    console.log('[subscription-coupons] Cupón inválido:', {
      code: code.trim(),
      reason,
      validationResult
    });

    return { 
      success: false,
      error: reasonMap[reason] || "Cupón inválido", 
      reason
    };
  }

  let finalPrice = Number(validationResult.final_price);
  const isFree = validationResult.is_free === true || finalPrice <= 0;
  
  // If coupon grants 100% discount, mark as free subscription
  if (isFree) {
    console.log('[subscription-coupons] Coupon grants free subscription:', {
      code,
      planId,
      originalPrice,
      discount: validationResult.discount,
    });

    return { 
      success: true,
      finalPrice: 0,
      couponData: {
        coupon_id: validationResult.coupon_id,
        coupon_code: validationResult.coupon_code,
        type: validationResult.type,
        amount: validationResult.amount,
        discount: validationResult.discount,
        is_free: true,
      }
    };
  }
  
  // Round for ARS (Mercado Pago Argentina requirement)
  if (currency === 'ARS') {
    finalPrice = Math.round(finalPrice);
  }

  console.log('[subscription-coupons] Coupon validated successfully:', {
    code,
    originalPrice,
    finalPrice,
    discount: validationResult.discount,
  });

  return { 
    success: true, 
    finalPrice,
    couponData: {
      coupon_id: validationResult.coupon_id,
      coupon_code: validationResult.coupon_code,
      type: validationResult.type,
      amount: validationResult.amount,
      discount: validationResult.discount,
      is_free: false,
    }
  };
}

/**
 * Records a coupon redemption for a subscription
 */
export async function markSubscriptionCouponAsUsed(
  supabase: SupabaseClient,
  couponId: string,
  userId: string,
  subscriptionId: string,
  planId: string,
  amountSaved: number,
  currency: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[subscription-coupons] Marking coupon as used:', {
    couponId,
    userId,
    subscriptionId,
    planId,
    amountSaved,
    currency,
  });

  const { error: insertError } = await supabase
    .from('coupon_redemptions')
    .insert({
      coupon_id: couponId,
      user_id: userId,
      subscription_id: subscriptionId,
      plan_id: planId,
      amount_saved: amountSaved,
      currency: currency,
      // course_id is now nullable, leave it null for subscriptions
    });

  if (insertError) {
    console.error('[subscription-coupons] Error inserting coupon redemption:', insertError);
    return { success: false, error: insertError.message };
  }

  console.log('[subscription-coupons] Coupon redemption recorded successfully');
  return { success: true };
}
