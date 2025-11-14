import { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionUpgradeParams = {
  organizationId: string;
  planId: string;
  billingPeriod: 'monthly' | 'annual';
  paymentId: string;
  amount: number;
  currency: string;
};

export async function upgradeOrganizationPlan(
  supabase: SupabaseClient,
  params: SubscriptionUpgradeParams
): Promise<void> {
  console.log('🏢 [subscriptions] Starting upgrade...', params);
  
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

  const { error: cycleError } = await supabase
    .from('organization_billing_cycles')
    .insert({
      organization_id: params.organizationId,
      subscription_id: subscription.id,
      plan_id: params.planId,
      
      // Snapshot real de miembros en la organización
      seats: actualSeats,
      
      // Precio base del plan
      amount_per_seat: amountPerSeat,
      
      // NOTA EXPLICATIVA: Este es el primer pago, solo se cobró 1 seat
      seat_price_source: 'first_teams_payment_1_seat',
      
      // Montos REALES cobrados (1 seat)
      base_amount: params.amount,
      proration_adjustment: 0,
      total_amount: params.amount,
      
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
  } else {
    console.log('[subscriptions] ✅ Billing cycle created:', {
      organizationId: params.organizationId,
      seats: actualSeats,
      amount_per_seat: amountPerSeat,
      base_amount: params.amount,
      total_amount: params.amount,
      note: 'First TEAMS payment - only 1 seat billed'
    });
  }
  
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ plan_id: params.planId })
    .eq('id', params.organizationId);
  
  if (orgError) {
    console.error('❌ [subscriptions] ERROR updating organization:', orgError);
    throw orgError;
  }
  
  console.log('✅ [subscriptions] Success! Subscription created:', subscription);
}
