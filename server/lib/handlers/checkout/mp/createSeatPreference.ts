import { SupabaseClient } from "@supabase/supabase-js";
import { createMPPreference } from "./api.js";
import { encodeCustomData } from "./encoding.js";

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

    const customData = encodeCustomData({
      auth_id: authId,
      product_type: 'seat',
      organization_id: organizationId,
      subscription_id: subscriptionId,
      billing_period: billingPeriod,
      invitee_email: inviteeEmail,
      role_id: roleId,
    });

    const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';
    
    const prefBody = {
      items: [
        {
          id: `seat-${organizationId}`,
          category_id: 'seat',
          title: `Nuevo miembro - ${org.name}`,
          description: `Agregar ${inviteeEmail} como ${roleName}`,
          quantity: 1,
          unit_price: proratedAmountARS,
          currency_id: 'ARS',
        }
      ],
      external_reference: customData,
      payer: {
        email: user?.email || null,
        first_name: user?.full_name?.split(' ')[0] || 'Usuario',
        last_name: user?.full_name?.split(' ').slice(1).join(' ') || '',
      },
      notification_url: `${baseUrl}/api/checkout/mp/webhook`,
      back_urls: {
        success: `${baseUrl}/api/checkout/mp/seat-success`,
        failure: `${baseUrl}/organization/members?payment=failed`,
        pending: `${baseUrl}/organization/members?payment=pending`,
      },
      auto_return: 'approved',
      binary_mode: true,
      statement_descriptor: 'SEENCEL',
      metadata: {
        user_id: userId,
        auth_id: authId,
        organization_id: organizationId,
        subscription_id: subscriptionId,
        invitee_email: inviteeEmail,
        role_id: roleId,
        product_type: 'seat',
        billing_period: billingPeriod,
      },
    };

    const result = await createMPPreference(prefBody);

    if (!result.success) {
      console.error('[createSeatPreference] MP API error:', result);
      return { success: false, error: result.error || 'Error al crear preferencia de pago' };
    }

    console.log('[createSeatPreference] Created preference:', {
      id: result.preferenceId,
      init_point: result.initPoint,
      inviteeEmail,
      amount: proratedAmountARS,
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
