import { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, addYears } from 'date-fns';

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

export type ValidateSubscriptionCouponParams = {
  supabase: SupabaseClient;
  couponCode: string;
  planId: string;
  priceUSD: number;
  currency: string;
};

export type ValidateSubscriptionCouponResult = 
  | { valid: true; isFree: boolean; couponId?: string; couponCode?: string; discount?: number; finalPriceUSD?: number }
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
  const { supabase, couponCode, planId, priceUSD, currency } = params;
  
  console.log('[subscription-coupons] Validating coupon (new API):', { couponCode, planId, priceUSD, currency });

  const { data: validationResult, error: couponError } = await supabase.rpc(
    'validate_subscription_coupon', 
    {
      p_code: couponCode.trim(),
      p_plan_id: planId,
      p_price: priceUSD,
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

  const finalPrice = Number(validationResult.final_price);
  const isFree = validationResult.is_free === true || finalPrice <= 0;
  
  console.log('[subscription-coupons] Coupon validated successfully:', {
    couponCode,
    priceUSD,
    finalPrice,
    isFree,
    discount: validationResult.discount,
  });

  return { 
    valid: true,
    isFree,
    couponId: validationResult.coupon_id,
    couponCode: validationResult.coupon_code,
    discount: validationResult.discount,
    finalPriceUSD: finalPrice,
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
  const { supabase, authId, organizationId, planId, planSlug, billingPeriod, couponId, couponCode, userId } = params;
  
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
        currency: 'USD',
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
    const { error: orgError } = await supabase
      .from('organizations')
      .update({ plan_id: planId })
      .eq('id', organizationId);

    if (orgError) {
      console.error('[subscription-coupons] Error updating organization plan:', orgError);
      return { success: false, error: orgError.message };
    }

    // 4. Record coupon redemption
    const { error: redemptionError } = await supabase
      .from('coupon_redemptions')
      .insert({
        coupon_id: couponId,
        user_id: userId,
        subscription_id: subscriptionId,
        plan_id: planId,
        amount_saved: 0, // Full price was saved, but we'll compute it later if needed
        currency: 'USD',
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
