import { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { createMPPreference } from "./api.js";
import { MP_WEBHOOK_SECRET } from "./config.js";
import { getAdminClient } from "../../../../routes/_base.js";

export interface CreateSeatPreferenceParams {
  supabase: SupabaseClient;
  userId: string;
  authId: string;
  organizationId: string;
  inviteeEmail: string;
  roleId: string;
  proratedAmountARS: number;
  subscriptionId: string;
  billingPeriod: 'monthly' | 'annual';
}

export interface CreateSeatPreferenceResult {
  success: boolean;
  preferenceUrl?: string;
  preferenceId?: string;
  error?: string;
}

export async function createSeatPreference(
  params: CreateSeatPreferenceParams
): Promise<CreateSeatPreferenceResult> {
  const {
    supabase,
    userId,
    authId,
    organizationId,
    inviteeEmail,
    roleId,
    proratedAmountARS,
    subscriptionId,
    billingPeriod,
  } = params;

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

    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const payerEmail = user?.email;
    if (!payerEmail) {
      return { success: false, error: 'Email del usuario no encontrado' };
    }

    let amount = Math.round(proratedAmountARS);
    if (amount < 1) amount = 1;

    const shortId = `mps_${nanoid(12)}`;
    const adminClient = getAdminClient();

    const { error: insertError } = await adminClient
      .from("mp_subscription_preferences")
      .insert({
        id: shortId,
        user_id: userId,
        organization_id: organizationId,
        billing_period: billingPeriod,
        amount_ars: String(amount),
        product_type: 'seat',
        invitee_email: inviteeEmail,
        role_id: roleId,
        subscription_id: subscriptionId,
      });

    if (insertError) {
      console.error("[createSeatPreference] Error saving preference to DB:", insertError);
    } else {
      console.log("[createSeatPreference] Preference saved with short ID:", shortId);
    }

    const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';

    const prefBody = {
      items: [
        {
          id: `seat-${organizationId}`,
          category_id: 'services',
          title: `Nuevo miembro - ${org.name}`,
          description: `Agregar ${inviteeEmail} como ${roleName}`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS',
        }
      ],
      external_reference: shortId,
      payer: {
        email: payerEmail,
        first_name: user?.full_name?.split(' ')[0] || 'Usuario',
        last_name: user?.full_name?.split(' ').slice(1).join(' ') || 'Seencel',
      },
      notification_url: `${baseUrl}/api/checkout/mp/webhook?secret=${MP_WEBHOOK_SECRET}`,
      back_urls: {
        success: `${baseUrl}/organization/billing?payment=success`,
        failure: `${baseUrl}/organization/billing?payment=failed`,
        pending: `${baseUrl}/organization/billing?payment=pending`,
      },
      auto_return: 'approved',
      binary_mode: true,
      statement_descriptor: 'SEENCEL SEAT',
      metadata: {
        user_id: userId,
        auth_id: authId,
        organization_id: organizationId,
        subscription_id: subscriptionId,
        invitee_email: inviteeEmail,
        role_id: roleId,
        product_type: 'seat',
        billing_period: billingPeriod,
        amount_ars: amount,
      },
    };

    console.log('[createSeatPreference] Creating preference:', {
      shortId,
      inviteeEmail,
      amount,
      organizationId,
    });

    const result = await createMPPreference(prefBody);

    if (!result.success) {
      console.error('[createSeatPreference] MP API error:', result);
      return { success: false, error: result.error || 'Error al crear preferencia de pago' };
    }

    const { error: updateError } = await adminClient
      .from("mp_subscription_preferences")
      .update({ preference_id: result.preferenceId })
      .eq("id", shortId);
    
    if (updateError) {
      console.warn('[createSeatPreference] Failed to update preference with preference_id:', updateError);
    }

    console.log('[createSeatPreference] Created preference:', {
      id: result.preferenceId,
      init_point: result.initPoint,
      shortId,
      inviteeEmail,
      amount,
    });

    return {
      success: true,
      preferenceId: result.preferenceId,
      preferenceUrl: result.initPoint,
    };
  } catch (error: any) {
    console.error('[createSeatPreference] Error:', error);
    return {
      success: false,
      error: error.message || 'Error al crear preferencia de pago',
    };
  }
}
