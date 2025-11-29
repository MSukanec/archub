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
}
