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

    result.success = true;
    return result;

  } catch (error: any) {
    result.error = `Unexpected error: ${error.message}`;
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
  
  const { data: subscription, error: subError } = await supabase
    .from('organization_subscriptions')
    .insert({
      organization_id: params.organizationId,
      plan_id: params.planId,
      payment_id: params.paymentId,
      status: 'active',
      billing_period: params.billingPeriod,
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      amount: params.amount,
      currency: params.currency,
    })
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

  // Obtener precio del plan
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('monthly_amount, annual_amount')
    .eq('id', params.planId)
    .single();

  if (planError) {
    console.error('[subscriptions] Error fetching plan:', planError);
  }

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
