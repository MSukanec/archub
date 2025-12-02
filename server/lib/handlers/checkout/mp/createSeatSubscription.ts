import { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { createMPPreapproval, type MPAutoRecurring } from "./subscriptions-api.js";
import { MP_WEBHOOK_SECRET } from "./config.js";
import { getAdminClient } from "../../../../routes/_base.js";

/**
 * Creates a new MP subscription for a gifted org's first paid seat.
 * 
 * When an org was created with a 100% coupon, it has no provider_subscription_id.
 * When they add their first paid member, we need to CREATE a new MP subscription
 * instead of trying to UPDATE one that doesn't exist.
 * 
 * The new subscription should be for JUST the seat amount, since the owner is free.
 * Future seat additions will UPDATE this subscription.
 */

export interface CreateSeatSubscriptionParams {
  supabase: SupabaseClient;
  userId: string;
  organizationId: string;
  subscriptionId: string;
  inviteeEmail: string;
  roleId: string;
  seatAmountARS: number;
  billingPeriod: 'monthly' | 'annual';
  payerEmail: string;
  payerName?: string;
  subscriptionExpiresAt: string;
}

export interface CreateSeatSubscriptionResult {
  success: boolean;
  initPoint?: string;
  preapprovalId?: string;
  shortId?: string;
  error?: string;
}

export async function createSeatSubscription(
  params: CreateSeatSubscriptionParams
): Promise<CreateSeatSubscriptionResult> {
  const {
    supabase,
    userId,
    organizationId,
    subscriptionId,
    inviteeEmail,
    roleId,
    seatAmountARS,
    billingPeriod,
    payerEmail,
    payerName,
    subscriptionExpiresAt,
  } = params;

  console.log('[MP createSeatSubscription] Creating new seat subscription for gifted org:', {
    organizationId,
    subscriptionId,
    inviteeEmail,
    seatAmountARS,
    billingPeriod,
  });

  try {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return { success: false, error: 'Organización no encontrada' };
    }

    const { data: role } = await supabase
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .single();

    const roleName = role?.name || 'Miembro';

    let amount = Math.round(seatAmountARS);
    if (amount < 1) amount = 1;

    const shortId = `mps_${nanoid(12)}`;
    const adminClient = getAdminClient();

    const { error: insertError } = await adminClient
      .from("mp_subscription_preferences")
      .insert({
        id: shortId,
        user_id: userId,
        organization_id: organizationId,
        subscription_id: subscriptionId,
        billing_period: billingPeriod,
        amount_ars: String(amount),
        product_type: 'seat_subscription',
        invitee_email: inviteeEmail,
        role_id: roleId,
      });

    if (insertError) {
      console.error("[MP createSeatSubscription] Error saving preference to DB:", insertError);
    }

    const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';

    const frequency = billingPeriod === 'monthly' ? 1 : 12;
    const frequencyType: "months" = "months";

    const autoRecurring: MPAutoRecurring = {
      frequency,
      frequency_type: frequencyType,
      transaction_amount: amount,
      currency_id: "ARS",
    };

    const productTitle = `Miembros adicionales - ${org.name} (${billingPeriod === 'monthly' ? 'Mensual' : 'Anual'})`;

    console.log('[MP createSeatSubscription] Creating MP preapproval:', {
      shortId,
      amount,
      frequency,
      frequencyType,
    });

    const preapprovalResult = await createMPPreapproval({
      reason: productTitle,
      external_reference: shortId,
      payer_email: payerEmail,
      auto_recurring: autoRecurring,
      back_url: `${baseUrl}/api/checkout/mp/seat-subscription-success?preference_id=${shortId}`,
      status: "pending",
    });

    if (!preapprovalResult.success) {
      console.error("[MP createSeatSubscription] Error creating preapproval:", preapprovalResult);
      return {
        success: false,
        error: preapprovalResult.error || 'Error al crear suscripción de asientos',
      };
    }

    const { error: updateError } = await adminClient
      .from("mp_subscription_preferences")
      .update({ preapproval_id: preapprovalResult.preapprovalId })
      .eq("id", shortId);

    if (updateError) {
      console.warn('[MP createSeatSubscription] Failed to update preference with preapproval_id:', updateError);
    }

    console.log('[MP createSeatSubscription] Preapproval created:', {
      preapprovalId: preapprovalResult.preapprovalId,
      initPoint: preapprovalResult.initPoint,
      shortId,
      amount,
    });

    return {
      success: true,
      initPoint: preapprovalResult.initPoint,
      preapprovalId: preapprovalResult.preapprovalId,
      shortId,
    };

  } catch (error: any) {
    console.error('[MP createSeatSubscription] Error:', error);
    return {
      success: false,
      error: error.message || 'Error al crear suscripción de asientos',
    };
  }
}
