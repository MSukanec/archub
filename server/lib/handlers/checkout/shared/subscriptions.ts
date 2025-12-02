import { SupabaseClient } from "@supabase/supabase-js";
import { applyPlanLimits } from "./plan-limits.js";
import { upsertEnrollment } from "./enrollments.js";

export type ScheduledDowngradeParams = {
  organizationId: string;
  oldSubscriptionId: string;
  newPlanId: string;
  oldPlanId: string;
};

export type ScheduledDowngradeResult = {
  success: boolean;
  newSubscriptionId?: string;
  error?: string;
  details: {
    from_plan_id: string;
    to_plan_id: string;
    from_plan_name?: string;
    to_plan_name?: string;
  };
  limitsApplied?: {
    projectsMarked: number;
    membersMarked: number;
  };
};

/**
 * Execute a scheduled plan switch (downgrade) without requiring a new payment.
 * This is used by the cron job to process downgrades when subscriptions expire.
 * 
 * IMPORTANT: Only FREE plan downgrades are executed automatically.
 * Downgrades to paid plans require manual action (user must pay).
 */
export async function executeScheduledPlanSwitch(
  supabase: SupabaseClient,
  params: ScheduledDowngradeParams
): Promise<ScheduledDowngradeResult> {
  const { organizationId, oldSubscriptionId, newPlanId, oldPlanId } = params;

  const result: ScheduledDowngradeResult = {
    success: false,
    details: {
      from_plan_id: oldPlanId,
      to_plan_id: newPlanId,
    },
  };

  try {
    const { data: newPlan, error: planError } = await supabase
      .from('plans')
      .select('id, name, slug, monthly_amount, annual_amount')
      .eq('id', newPlanId)
      .single();

    if (planError || !newPlan) {
      result.error = `Plan not found: ${newPlanId}`;
      return result;
    }

    const { data: oldPlan } = await supabase
      .from('plans')
      .select('name')
      .eq('id', oldPlanId)
      .single();

    result.details.from_plan_name = oldPlan?.name || 'Unknown';
    result.details.to_plan_name = newPlan.name;

    const isFree = newPlan.slug === 'free';
    
    if (!isFree) {
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id, name')
        .eq('slug', 'free')
        .single();

      if (!freePlan) {
        result.error = `Automatic downgrade to paid plans not supported and FREE plan not found.`;
        return result;
      }

      result.details.to_plan_id = freePlan.id;
      result.details.to_plan_name = freePlan.name;
      
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);

      const { data: newSubscription, error: createError } = await supabase
        .from('organization_subscriptions')
        .insert({
          organization_id: organizationId,
          plan_id: freePlan.id,
          payment_id: null,
          status: 'active',
          billing_period: 'annual',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          amount: 0,
          currency: 'USD',
          scheduled_downgrade_plan_id: null,
        })
        .select()
        .single();

      if (createError || !newSubscription) {
        result.error = `Failed to create FREE subscription: ${createError?.message}`;
        return result;
      }

      result.newSubscriptionId = newSubscription.id;

      const { error: orgError } = await supabase
        .from('organizations')
        .update({ plan_id: freePlan.id })
        .eq('id', organizationId);

      if (orgError) {
        await supabase
          .from('organization_subscriptions')
          .delete()
          .eq('id', newSubscription.id);
        
        result.error = `Failed to update organization plan: ${orgError.message}`;
        return result;
      }

      const { error: expireError } = await supabase
        .from('organization_subscriptions')
        .update({ 
          status: 'expired', 
          cancelled_at: new Date().toISOString(),
          scheduled_downgrade_plan_id: null,
        })
        .eq('id', oldSubscriptionId);

      if (expireError) {
        console.error('[executeScheduledPlanSwitch] Failed to expire old subscription:', expireError);
        result.error = `Switched to FREE but failed to expire old subscription: ${expireError.message}`;
        result.success = false;
        return result;
      }

      const limitsResult = await applyPlanLimits(supabase, organizationId, 'Free');
      result.limitsApplied = {
        projectsMarked: limitsResult.projectsMarked,
        membersMarked: limitsResult.membersMarked,
      };

      // Suspend bonus course enrollments when downgrading to FREE
      const suspendResult = await suspendBonusCourseEnrollments(supabase, organizationId);
      if (suspendResult.suspended > 0) {
        console.log(`[executeScheduledPlanSwitch] Suspended ${suspendResult.suspended} bonus course enrollments`);
      }

      result.error = `Downgrade to paid plan ${newPlan.name} not supported. Switched to FREE instead.`;
      result.success = true;
      return result;
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);

    const { data: newSubscription, error: createError } = await supabase
      .from('organization_subscriptions')
      .insert({
        organization_id: organizationId,
        plan_id: newPlanId,
        payment_id: null,
        status: 'active',
        billing_period: 'annual',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        amount: 0,
        currency: 'USD',
        scheduled_downgrade_plan_id: null,
      })
      .select()
      .single();

    if (createError || !newSubscription) {
      result.error = `Failed to create new subscription: ${createError?.message}`;
      return result;
    }

    result.newSubscriptionId = newSubscription.id;

    const { error: orgError } = await supabase
      .from('organizations')
      .update({ plan_id: newPlanId })
      .eq('id', organizationId);

    if (orgError) {
      await supabase
        .from('organization_subscriptions')
        .delete()
        .eq('id', newSubscription.id);
      
      result.error = `Failed to update organization plan: ${orgError.message}`;
      return result;
    }

    const { error: expireError } = await supabase
      .from('organization_subscriptions')
      .update({ 
        status: 'expired', 
        cancelled_at: new Date().toISOString(),
        scheduled_downgrade_plan_id: null,
      })
      .eq('id', oldSubscriptionId);

    if (expireError) {
      console.error('[executeScheduledPlanSwitch] Failed to expire old subscription:', expireError);
      result.error = `Plan switched successfully but failed to expire old subscription: ${expireError.message}`;
      result.success = false;
      return result;
    }

    const limitsResult = await applyPlanLimits(supabase, organizationId, result.details.to_plan_name || 'Free');
    result.limitsApplied = {
      projectsMarked: limitsResult.projectsMarked,
      membersMarked: limitsResult.membersMarked,
    };

    // Suspend bonus course enrollments when downgrading to FREE
    if (isFree) {
      const suspendResult = await suspendBonusCourseEnrollments(supabase, organizationId);
      if (suspendResult.suspended > 0) {
        console.log(`[executeScheduledPlanSwitch] Suspended ${suspendResult.suspended} bonus course enrollments`);
      }
    }

    result.success = true;
    return result;

  } catch (error: any) {
    result.error = `Unexpected error: ${error.message}`;
    return result;
  }
}

/**
 * Suspend bonus course enrollments for all members of an organization.
 * Called when organization downgrades to FREE plan.
 * Sets enrollment status to 'suspended' - data is preserved, but access is blocked.
 */
export async function suspendBonusCourseEnrollments(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{ suspended: number; error?: string }> {
  const result = { suspended: 0, error: undefined as string | undefined };

  try {
    // Get founder_bonus_course_id from app_settings
    const { data: appSetting, error: settingError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'founder_bonus_course_id')
      .maybeSingle();

    if (settingError || !appSetting?.value) {
      console.log('[BonusCourse] No founder_bonus_course_id configured, skipping suspend');
      return result;
    }

    const bonusCourseId = appSetting.value;

    // Get all members of this organization
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (membersError || !members || members.length === 0) {
      console.log('[BonusCourse] No active members found for organization');
      return result;
    }

    const userIds = members.map(m => m.user_id);

    // Suspend all enrollments for the bonus course for these members
    const { data: updated, error: updateError } = await supabase
      .from('course_enrollments')
      .update({ 
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('course_id', bonusCourseId)
      .in('user_id', userIds)
      .eq('status', 'active')
      .select('id');

    if (updateError) {
      console.error('[BonusCourse] Error suspending enrollments:', updateError);
      result.error = updateError.message;
      return result;
    }

    result.suspended = updated?.length || 0;
    console.log(`[BonusCourse] Suspended ${result.suspended} enrollments for org ${organizationId}`);
    return result;

  } catch (error: any) {
    console.error('[BonusCourse] Unexpected error suspending enrollments:', error);
    result.error = error.message;
    return result;
  }
}

/**
 * Reactivate bonus course enrollments for all members of an organization.
 * Called when organization upgrades to a paid plan.
 * Changes 'suspended' enrollments back to 'active'.
 */
export async function reactivateBonusCourseEnrollments(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{ reactivated: number; error?: string }> {
  const result = { reactivated: 0, error: undefined as string | undefined };

  try {
    // Get founder_bonus_course_id from app_settings
    const { data: appSetting, error: settingError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'founder_bonus_course_id')
      .maybeSingle();

    if (settingError || !appSetting?.value) {
      console.log('[BonusCourse] No founder_bonus_course_id configured, skipping reactivate');
      return result;
    }

    const bonusCourseId = appSetting.value;

    // Get all members of this organization
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (membersError || !members || members.length === 0) {
      console.log('[BonusCourse] No active members found for organization');
      return result;
    }

    const userIds = members.map(m => m.user_id);

    // Reactivate all suspended enrollments for the bonus course for these members
    const { data: updated, error: updateError } = await supabase
      .from('course_enrollments')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('course_id', bonusCourseId)
      .in('user_id', userIds)
      .eq('status', 'suspended')
      .select('id');

    if (updateError) {
      console.error('[BonusCourse] Error reactivating enrollments:', updateError);
      result.error = updateError.message;
      return result;
    }

    result.reactivated = updated?.length || 0;
    console.log(`[BonusCourse] Reactivated ${result.reactivated} enrollments for org ${organizationId}`);
    return result;

  } catch (error: any) {
    console.error('[BonusCourse] Unexpected error reactivating enrollments:', error);
    result.error = error.message;
    return result;
  }
}

export type SubscriptionUpgradeParams = {
  organizationId: string;
  planId: string;
  billingPeriod: 'monthly' | 'annual';
  paymentId: string;
  amount: number;
  currency: string;
  userId?: string | null;
  providerSubscriptionId?: string | null;
  payerEmail?: string | null; // Email used for MP payments (for seat billing)
};

/**
 * Apply Founders Program benefits for annual subscribers.
 * - Marks organization as founder in settings
 * - Enrolls the paying user in the bonus course with lifetime access
 */
async function applyFoundersProgram(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  billingPeriod: 'monthly' | 'annual'
): Promise<void> {
  if (billingPeriod !== 'annual') {
    return;
  }

  console.log('[Founders] 🎉 Annual subscription detected, applying Founders Program...');

  try {
    const { data: org, error: orgFetchError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    if (orgFetchError) {
      console.error('[Founders] ❌ Error fetching organization:', orgFetchError);
      return;
    }

    const existingSettings = (org?.settings as Record<string, any>) || {};
    
    if (existingSettings.is_founder) {
      console.log('[Founders] ℹ️ Organization already marked as founder, skipping mark');
    } else {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          settings: {
            ...existingSettings,
            is_founder: true,
            founder_since: new Date().toISOString(),
          }
        })
        .eq('id', organizationId);

      if (updateError) {
        console.error('[Founders] ❌ Error marking organization as founder:', updateError);
      } else {
        console.log('[Founders] ✅ Organization marked as founder');
      }
    }

    const { data: appSetting, error: settingError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'founder_bonus_course_id')
      .maybeSingle();

    if (settingError || !appSetting?.value) {
      console.warn('[Founders] ⚠️ No founder_bonus_course_id configured in app_settings');
      return;
    }

    const bonusCourseId = appSetting.value;
    console.log('[Founders] 📚 Enrolling user in bonus course:', bonusCourseId);

    const enrollResult = await upsertEnrollment(supabase, userId, bonusCourseId, null);
    
    if (enrollResult.success) {
      console.log('[Founders] ✅ User enrolled in bonus course with lifetime access');
    } else {
      console.error('[Founders] ❌ Error enrolling user:', enrollResult.error);
    }

  } catch (error: any) {
    console.error('[Founders] ❌ Unexpected error in applyFoundersProgram:', error.message);
  }
}

export async function upgradeOrganizationPlan(
  supabase: SupabaseClient,
  params: SubscriptionUpgradeParams
): Promise<void> {
  const { error: cancelError } = await supabase
    .from('organization_subscriptions')
    .update({ 
      status: 'expired', 
      cancelled_at: new Date().toISOString() 
    })
    .eq('organization_id', params.organizationId)
    .eq('status', 'active');
  
  if (cancelError) {
    console.error('⚠️ [subscriptions] Error cancelling previous subscription:', cancelError);
  }
  
  const expiresAt = new Date();
  if (params.billingPeriod === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }
  
  const subscriptionInsert: Record<string, any> = {
    organization_id: params.organizationId,
    plan_id: params.planId,
    payment_id: params.paymentId,
    status: 'active',
    billing_period: params.billingPeriod,
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    amount: params.amount,
    currency: params.currency,
  };

  if (params.providerSubscriptionId) {
    subscriptionInsert.provider_subscription_id = params.providerSubscriptionId;
  }

  if (params.payerEmail) {
    subscriptionInsert.payer_email = params.payerEmail;
  }

  const { data: subscription, error: subError } = await supabase
    .from('organization_subscriptions')
    .insert(subscriptionInsert)
    .select()
    .single();
  
  if (subError) {
    console.error('❌ [subscriptions] ERROR creating subscription:', subError);
    throw subError;
  }

  // Contar billable members REALES en la organización
  const { data: billableMembers } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', params.organizationId)
    .eq('is_billable', true)
    .eq('status', 'active');

  const actualSeats = billableMembers?.length || 1;

  // Para el primer pago de TEAMS, siempre es 1 seat facturado
  const billedSeats = 1;

  // Obtener precio y nombre del plan
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('name, monthly_amount, annual_amount')
    .eq('id', params.planId)
    .single();

  if (planError) {
    console.error('[subscriptions] Error fetching plan:', planError);
  }

  const planName = plan?.name || 'Pro';

  const basePlanPrice = params.billingPeriod === 'monthly' 
    ? (plan?.monthly_amount || params.amount)
    : (plan?.annual_amount || params.amount);

  const amountPerSeat = Number(basePlanPrice);

  // Calcular montos basados en billed_seats (no actual seats)
  const baseAmount = billedSeats * amountPerSeat;

  const { error: cycleError } = await supabase
    .from('organization_billing_cycles')
    .insert({
      organization_id: params.organizationId,
      subscription_id: subscription.id,
      plan_id: params.planId,
      
      // Snapshot histórico real
      seats: actualSeats,
      
      // Seats realmente facturados
      billed_seats: billedSeats,
      
      amount_per_seat: amountPerSeat,
      seat_price_source: 'plans.monthly_amount',
      
      // Montos consistentes: billed_seats × amount_per_seat
      base_amount: baseAmount,
      proration_adjustment: 0,
      total_amount: baseAmount,
      
      billing_period: params.billingPeriod,
      period_start: new Date().toISOString(),
      period_end: expiresAt.toISOString(),
      paid: true,
      status: 'paid',
      payment_provider: params.currency === 'ARS' ? 'mercadopago' : 'paypal',
      payment_id: params.paymentId,
      currency_code: params.currency,
    });

  if (cycleError) {
    console.error('[subscriptions] Error creating billing cycle:', cycleError);
  }
  
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ plan_id: params.planId })
    .eq('id', params.organizationId);
  
  if (orgError) {
    console.error('❌ [subscriptions] ERROR updating organization:', orgError);
    throw orgError;
  }

  // Apply new plan limits - this will unlock projects/members that were over limit
  console.log(`[subscriptions] Applying plan limits for ${planName}...`);
  const limitsResult = await applyPlanLimits(supabase, params.organizationId, planName);
  if (limitsResult.success) {
    console.log(`[subscriptions] ✅ Plan limits applied: ${limitsResult.projectsMarked} projects marked, ${limitsResult.membersMarked} members marked`);
  } else {
    console.error(`[subscriptions] ⚠️ Error applying plan limits:`, limitsResult.error);
  }

  // Reactivate any suspended bonus course enrollments when upgrading to a paid plan
  const reactivateResult = await reactivateBonusCourseEnrollments(supabase, params.organizationId);
  if (reactivateResult.reactivated > 0) {
    console.log(`[subscriptions] Reactivated ${reactivateResult.reactivated} bonus course enrollments`);
  }

  // Apply Founders Program benefits for annual subscribers
  if (params.userId && params.billingPeriod === 'annual') {
    await applyFoundersProgram(
      supabase,
      params.organizationId,
      params.userId,
      params.billingPeriod
    );
  }
}

/**
 * Create a gifted subscription (100% discount coupon).
 * This creates a subscription WITHOUT going through MP/PayPal.
 * The owner is marked as non-billable.
 * 
 * IMPORTANT: When the org later adds paid members, the system must
 * detect that there's no provider_subscription_id and CREATE a new
 * MP subscription instead of trying to UPDATE one that doesn't exist.
 */
export type CreateGiftedSubscriptionParams = {
  organizationId: string;
  planId: string;
  billingPeriod: 'monthly' | 'annual';
  userId: string;
  couponId: string;
  couponCode: string;
  originalAmount: number;
  currency: string;
};

export type CreateGiftedSubscriptionResult = {
  success: boolean;
  subscriptionId?: string;
  error?: string;
};

export async function createGiftedSubscription(
  supabase: SupabaseClient,
  params: CreateGiftedSubscriptionParams
): Promise<CreateGiftedSubscriptionResult> {
  console.log('[subscriptions] Creating gifted subscription with coupon:', {
    organizationId: params.organizationId,
    planId: params.planId,
    billingPeriod: params.billingPeriod,
    couponCode: params.couponCode,
  });

  try {
    // 1. Cancel any existing active subscriptions
    const { error: cancelError } = await supabase
      .from('organization_subscriptions')
      .update({ 
        status: 'expired', 
        cancelled_at: new Date().toISOString() 
      })
      .eq('organization_id', params.organizationId)
      .eq('status', 'active');
    
    if (cancelError) {
      console.error('[subscriptions] Error cancelling previous subscription:', cancelError);
    }

    // 2. Calculate expiration date
    const expiresAt = new Date();
    if (params.billingPeriod === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // 3. Create the subscription WITHOUT provider_subscription_id
    // This is the key difference - no MP/PayPal subscription is created
    const { data: subscription, error: subError } = await supabase
      .from('organization_subscriptions')
      .insert({
        organization_id: params.organizationId,
        plan_id: params.planId,
        payment_id: null, // No payment for gifted subscriptions
        provider_subscription_id: null, // KEY: No external subscription
        status: 'active',
        billing_period: params.billingPeriod,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        amount: 0, // Free with coupon
        currency: params.currency,
        coupon_id: params.couponId,
        coupon_code: params.couponCode,
      })
      .select()
      .single();

    if (subError || !subscription) {
      console.error('[subscriptions] Error creating gifted subscription:', subError);
      return { success: false, error: subError?.message || 'Error creating subscription' };
    }

    console.log('[subscriptions] Gifted subscription created:', subscription.id);

    // 4. Update organization's plan
    const { error: orgError } = await supabase
      .from('organizations')
      .update({ plan_id: params.planId })
      .eq('id', params.organizationId);

    if (orgError) {
      console.error('[subscriptions] Error updating organization plan:', orgError);
      // Rollback the subscription
      await supabase
        .from('organization_subscriptions')
        .delete()
        .eq('id', subscription.id);
      return { success: false, error: 'Error updating organization' };
    }

    // 5. Mark the owner as NON-BILLABLE
    // This ensures the owner doesn't count toward seat billing
    const { error: memberError } = await supabase
      .from('organization_members')
      .update({ is_billable: false })
      .eq('organization_id', params.organizationId)
      .eq('user_id', params.userId)
      .eq('is_active', true);

    if (memberError) {
      console.error('[subscriptions] Error marking owner as non-billable:', memberError);
      // Non-fatal, continue
    } else {
      console.log('[subscriptions] Owner marked as non-billable');
    }

    // 6. Get plan name for limits
    const { data: plan } = await supabase
      .from('plans')
      .select('name')
      .eq('id', params.planId)
      .single();

    const planName = plan?.name || 'Pro';

    // 7. Apply plan limits
    const limitsResult = await applyPlanLimits(supabase, params.organizationId, planName);
    console.log('[subscriptions] Plan limits applied:', limitsResult);

    // 8. Reactivate any suspended bonus course enrollments
    const reactivateResult = await reactivateBonusCourseEnrollments(supabase, params.organizationId);
    if (reactivateResult.reactivated > 0) {
      console.log(`[subscriptions] Reactivated ${reactivateResult.reactivated} bonus course enrollments`);
    }

    // 9. Apply Founders Program for annual subscriptions
    if (params.billingPeriod === 'annual') {
      await applyFoundersProgram(
        supabase,
        params.organizationId,
        params.userId,
        params.billingPeriod
      );
    }

    console.log('[subscriptions] Gifted subscription setup complete:', {
      subscriptionId: subscription.id,
      planId: params.planId,
      billingPeriod: params.billingPeriod,
      expiresAt: expiresAt.toISOString(),
    });

    return { success: true, subscriptionId: subscription.id };

  } catch (error: any) {
    console.error('[subscriptions] Unexpected error creating gifted subscription:', error);
    return { success: false, error: error.message || 'Unexpected error' };
  }
}
