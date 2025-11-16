// server/lib/handlers/organization/clientPayments.ts
import type { ProjectsContext } from '../projects/shared.js';
import { ensureAuth, ensureOrganizationAccess } from '../projects/shared.js';
import type { ClientPayment } from '../projects/clientPayments.js';

export interface ListOrganizationClientPaymentsParams {
  organizationId: string;
}

export type ListOrganizationClientPaymentsResult =
  | { success: true; data: ClientPayment[] }
  | { success: false; error: string };

export async function listOrganizationClientPayments(
  ctx: ProjectsContext,
  params: ListOrganizationClientPaymentsParams
): Promise<ListOrganizationClientPaymentsResult> {
  try {
    const { supabase } = ctx;

    if (!params.organizationId) {
      return { success: false, error: 'organizationId is required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Query client_payments for all projects in the organization with all necessary JOINs
    const { data: clientPayments, error } = await supabase
      .from('client_payments')
      .select(`
        *,
        contact:contacts!contact_id (
          id,
          first_name,
          last_name,
          full_name,
          email,
          phone,
          company_name,
          linked_user:users!linked_user_id (
            id,
            avatar_url
          )
        ),
        project_client:project_clients!fk_payment_client (
          id,
          unit
        ),
        currency:currencies!currency_id (
          id,
          code,
          symbol
        ),
        wallet:organization_wallets!wallet_id (
          id,
          wallet_id,
          wallets:wallet_id (
            id,
            name
          )
        ),
        commitment:client_commitments!commitment_id (
          id,
          amount
        ),
        schedule:client_payment_schedule!schedule_id (
          id,
          due_date,
          amount
        ),
        projects (
          id,
          name,
          color
        )
      `)
      .eq('organization_id', params.organizationId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching organization client payments:', error);
      return { success: false, error: 'Failed to fetch client payments' };
    }

    // Normalize wallet structure: { id, wallet_id, wallets: {...} } → { id, name }
    const normalizedPayments = (clientPayments || []).map((payment: any) => ({
      ...payment,
      wallet: payment.wallet ? {
        id: payment.wallet.id,
        name: payment.wallet.wallets?.name || null
      } : null
    }));

    return { success: true, data: normalizedPayments };

  } catch (error: any) {
    console.error('Error in listOrganizationClientPayments handler:', error);
    return { success: false, error: error.message || 'Failed to list organization client payments' };
  }
}
