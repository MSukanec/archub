import { SupabaseClient } from "@supabase/supabase-js";
import { updateMPPreapproval, getMPPreapproval } from "./subscriptions-api.js";

interface UpdateSeatSubscriptionParams {
  supabase: SupabaseClient;
  subscriptionId: string;
  organizationId: string;
  billingPeriod: 'monthly' | 'annual';
}

interface UpdateSeatSubscriptionResult {
  success: boolean;
  error?: string;
  newAmount?: number;
  oldAmount?: number;
  seats?: number;
}

export async function updateSubscriptionForNewSeat(
  params: UpdateSeatSubscriptionParams
): Promise<UpdateSeatSubscriptionResult> {
  const { supabase, subscriptionId, organizationId, billingPeriod } = params;

  console.log('[MP updateSeatSubscription] Starting seat subscription update:', {
    subscriptionId,
    organizationId,
    billingPeriod,
  });

  try {
    const { data: subscription, error: subError } = await supabase
      .from('organization_subscriptions')
      .select(`
        id,
        provider_subscription_id,
        amount,
        currency,
        plan_id,
        status
      `)
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error('[MP updateSeatSubscription] Subscription not found:', subError);
      return { success: false, error: 'Suscripción no encontrada' };
    }

    if (!subscription.provider_subscription_id) {
      console.log('[MP updateSeatSubscription] No provider subscription ID - skipping MP update');
      return { success: true };
    }

    const preapprovalId = subscription.provider_subscription_id;

    const preapprovalCheck = await getMPPreapproval(preapprovalId);
    if (!preapprovalCheck.success) {
      console.error('[MP updateSeatSubscription] Failed to verify preapproval:', preapprovalCheck.error);
      return { success: false, error: 'No se pudo verificar la suscripción en MercadoPago' };
    }

    const mpPreapproval = preapprovalCheck.preapproval;
    if (mpPreapproval.status !== 'authorized') {
      console.warn('[MP updateSeatSubscription] Preapproval not authorized:', mpPreapproval.status);
      return { 
        success: false, 
        error: `La suscripción en MercadoPago tiene estado "${mpPreapproval.status}". Solo se pueden modificar suscripciones autorizadas.` 
      };
    }

    const mpCurrentAmount = mpPreapproval.auto_recurring?.transaction_amount;
    
    console.log('[MP updateSeatSubscription] MP preapproval state:', {
      preapprovalId,
      mpStatus: mpPreapproval.status,
      mpCurrentAmount,
      mpCurrency: mpPreapproval.auto_recurring?.currency_id,
      localAmount: subscription.amount,
      localCurrency: subscription.currency,
    });

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, monthly_amount, annual_amount')
      .eq('id', subscription.plan_id)
      .single();

    if (planError || !plan) {
      console.error('[MP updateSeatSubscription] Plan not found:', planError);
      return { success: false, error: 'Plan no encontrado' };
    }

    const { data: exchangeRate } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', 'USD')
      .eq('to_currency', 'ARS')
      .eq('is_active', true)
      .single();

    const arsRate = exchangeRate ? parseFloat(exchangeRate.rate) : 1200;

    const seatPriceUSD = parseFloat(billingPeriod === 'monthly' ? plan.monthly_amount : plan.annual_amount) || 0;
    const seatPriceARS = Math.round(seatPriceUSD * arsRate);

    const currentAmountARS = mpCurrentAmount || parseFloat(subscription.amount) || 0;
    const newAmountARS = Math.round(currentAmountARS + seatPriceARS);

    console.log('[MP updateSeatSubscription] Calculating new amount:', {
      currentAmountARS,
      seatPriceUSD,
      seatPriceARS,
      newAmountARS,
      arsRate,
    });

    const updateResult = await updateMPPreapproval(preapprovalId, {
      auto_recurring: {
        transaction_amount: newAmountARS,
        currency_id: "ARS",
      },
      reason: `${plan.name} - ${billingPeriod === 'monthly' ? 'Mensual' : 'Anual'} (actualizado por nuevo miembro)`,
    });

    if (!updateResult.success) {
      console.error('[MP updateSeatSubscription] MP update failed:', updateResult);
      return { 
        success: false, 
        error: updateResult.error || 'Error al actualizar suscripción en MercadoPago' 
      };
    }

    console.log('[MP updateSeatSubscription] MercadoPago preapproval updated:', {
      preapprovalId,
      oldAmount: currentAmountARS,
      newAmount: newAmountARS,
    });

    const { error: updateSubError } = await supabase
      .from('organization_subscriptions')
      .update({
        amount: newAmountARS.toString(),
        currency: 'ARS',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateSubError) {
      console.error('[MP updateSeatSubscription] Failed to update local subscription:', updateSubError);
    }

    // Solo contar miembros BILLABLE para el reporte
    const { count: activeSeats } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('is_billable', true);

    const { count: pendingSeats } = await supabase
      .from('organization_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    // Solo seats facturables
    const totalSeats = (activeSeats || 0) + (pendingSeats || 0);

    console.log('[MP updateSeatSubscription] Subscription updated successfully:', {
      subscriptionId,
      oldAmount: currentAmountARS,
      newAmount: newAmountARS,
      totalSeats,
    });

    return {
      success: true,
      oldAmount: currentAmountARS,
      newAmount: newAmountARS,
      seats: totalSeats,
    };

  } catch (error: any) {
    console.error('[MP updateSeatSubscription] Fatal error:', error);
    return { success: false, error: error.message || 'Error interno' };
  }
}
