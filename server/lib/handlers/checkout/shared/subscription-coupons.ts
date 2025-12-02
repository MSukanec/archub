import { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, addYears } from 'date-fns';

export type SubscriptionCouponValidationResult = 
  | { 
      success: true; 
      finalPrice: number; 
      couponData: {
        coupon_id: string;
        coupon_code: string;
        type: 'percent' | 'fixed';
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

export type ValidateSubscriptionCouponParams = {
  supabase: SupabaseClient;
  couponCode: string;
  planId: string;
  price: number;
  currency: 'USD' | 'ARS';
  userId?: string;
};

export type ValidateSubscriptionCouponResult = 
  | { valid: true; isFree: boolean; couponId?: string; couponCode?: string; discount?: number; finalPrice?: number }
  | { valid: false; reason?: string };

/**
 * Legacy API: Validates a coupon for subscription checkout (deprecated - use new API)
 * Returns the final price after discount or marks as free
 */
export async function validateSubscriptionCouponLegacy(
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

/**
 * New API: Validates a coupon for subscription checkout using object params
 * Used by createRecurringSubscription and createSubscriptionOrder
 */
export async function validateSubscriptionCoupon(
  params: ValidateSubscriptionCouponParams
): Promise<ValidateSubscriptionCouponResult> {
  const { supabase, couponCode, planId, price, currency, userId } = params;
  
  console.log('[subscription-coupons] Validating coupon (new API):', { couponCode, planId, price, currency, userId });

  const { data: validationResult, error: couponError } = await supabase.rpc(
    'validate_subscription_coupon', 
    {
      p_code: couponCode.trim(),
      p_plan_id: planId,
      p_price: price,
      p_currency: currency
    }
  );

  if (couponError) {
    console.error('[subscription-coupons] Error validating coupon:', couponError);
    return { valid: false, reason: couponError.message };
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
    console.log('[subscription-coupons] Cupón inválido:', { couponCode, reason });

    return { 
      valid: false,
      reason: reasonMap[reason] || "Cupón inválido"
    };
  }

  const couponId = validationResult.coupon_id;

  // Get coupon details for per_user_limit and currency validation
  const { data: couponDetails, error: couponDetailsError } = await supabase
    .from('coupons')
    .select('per_user_limit, currency, type')
    .eq('id', couponId)
    .single();

  if (couponDetailsError) {
    console.error('[subscription-coupons] Error fetching coupon details:', couponDetailsError);
    return { valid: false, reason: "Error validando cupón" };
  }

  // Check per-user limit if userId is provided
  if (userId && couponDetails.per_user_limit !== null) {
    const { count: userRedemptions, error: redemptionError } = await supabase
      .from('coupon_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', couponId)
      .eq('user_id', userId);

    if (redemptionError) {
      console.error('[subscription-coupons] Error checking redemptions:', redemptionError);
      return { valid: false, reason: "Error validando cupón" };
    }

    const currentRedemptions = userRedemptions || 0;
    if (currentRedemptions >= couponDetails.per_user_limit) {
      console.log('[subscription-coupons] Per-user limit exceeded:', { 
        couponCode, 
        userId, 
        currentRedemptions, 
        limit: couponDetails.per_user_limit 
      });
      return { 
        valid: false, 
        reason: "Has alcanzado el límite de usos para este cupón" 
      };
    }
  }

  // Validate currency for fixed-type coupons
  if (couponDetails.type === 'fixed' && couponDetails.currency !== null) {
    if (couponDetails.currency !== currency) {
      console.log('[subscription-coupons] Currency mismatch for fixed coupon:', { 
        couponCode, 
        couponCurrency: couponDetails.currency, 
        requestedCurrency: currency 
      });
      return { 
        valid: false, 
        reason: `Este cupón solo es válido para pagos en ${couponDetails.currency}` 
      };
    }
  }

  const finalPriceValue = Number(validationResult.final_price);
  const isFree = validationResult.is_free === true || finalPriceValue <= 0;
  
  console.log('[subscription-coupons] Coupon validated successfully:', {
    couponCode,
    price,
    currency,
    finalPrice: finalPriceValue,
    isFree,
    discount: validationResult.discount,
  });

  return { 
    valid: true,
    isFree,
    couponId: validationResult.coupon_id,
    couponCode: validationResult.coupon_code,
    discount: validationResult.discount,
    finalPrice: finalPriceValue,
  };
}

export type CreateGiftedSubscriptionParams = {
  supabase: SupabaseClient;
  authId: string;
  organizationId: string;
  planId: string;
  planSlug: string;
  billingPeriod: 'monthly' | 'annual';
  couponId: string;
  couponCode: string;
  userId: string;
  currency: 'USD' | 'ARS';
};

export type CreateGiftedSubscriptionResult = 
  | { success: true; subscriptionId: string }
  | { success: false; error: string };

/**
 * Creates a subscription without payment gateway (100% discount coupon)
 * - Creates organization_subscription with coupon metadata
 * - Marks owner as non-billable
 * - Records coupon redemption
 * - Updates organization plan
 */
export async function createGiftedSubscription(
  params: CreateGiftedSubscriptionParams
): Promise<CreateGiftedSubscriptionResult> {
  const { supabase, authId, organizationId, planId, planSlug, billingPeriod, couponId, couponCode, userId, currency } = params;
  
  console.log('[subscription-coupons] Creating gifted subscription:', {
    organizationId,
    planSlug,
    billingPeriod,
    couponCode,
  });

  try {
    const now = new Date();
    const expiresAt = billingPeriod === 'monthly' 
      ? addMonths(now, 1) 
      : addYears(now, 1);

    // 1. Create the subscription record
    const { data: subscription, error: subError } = await supabase
      .from('organization_subscriptions')
      .insert({
        organization_id: organizationId,
        plan_id: planId,
        status: 'active',
        billing_period: billingPeriod,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        amount: 0,
        currency: currency,
        coupon_id: couponId,
        coupon_code: couponCode,
        // provider_subscription_id is NULL - this is a gifted subscription
      })
      .select('id')
      .single();

    if (subError || !subscription) {
      console.error('[subscription-coupons] Error creating gifted subscription:', subError);
      return { success: false, error: subError?.message || 'Error creando suscripción' };
    }

    const subscriptionId = subscription.id;
    console.log('[subscription-coupons] Subscription created:', subscriptionId);

    // 2. Mark the owner as non-billable (they got it free)
    const { error: memberError } = await supabase
      .from('organization_members')
      .update({ is_billable: false })
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (memberError) {
      console.warn('[subscription-coupons] Warning: Could not mark owner as non-billable:', memberError);
    }

    // 3. Update organization with new plan
    console.log('[subscription-coupons] Updating organization plan:', { organizationId, planId });
    
    const { data: orgUpdate, error: orgError } = await supabase
      .from('organizations')
      .update({ plan_id: planId })
      .eq('id', organizationId)
      .select('id, plan_id');

    if (orgError) {
      console.error('[subscription-coupons] Error updating organization plan:', orgError);
      return { success: false, error: orgError.message };
    }
    
    console.log('[subscription-coupons] Organization plan updated:', orgUpdate);

    // 4. Record coupon redemption
    const { error: redemptionError } = await supabase
      .from('coupon_redemptions')
      .insert({
        coupon_id: couponId,
        user_id: userId,
        subscription_id: subscriptionId,
        plan_id: planId,
        amount_saved: 0, // Full price was saved, but we'll compute it later if needed
        currency: currency,
      });

    if (redemptionError) {
      console.warn('[subscription-coupons] Warning: Could not record coupon redemption:', redemptionError);
    }

    console.log('[subscription-coupons] Gifted subscription created successfully:', {
      subscriptionId,
      organizationId,
      planSlug,
      expiresAt: expiresAt.toISOString(),
    });

    return { success: true, subscriptionId };

  } catch (e: any) {
    console.error('[subscription-coupons] Error creating gifted subscription:', e);
    return { success: false, error: e.message || String(e) };
  }
}
