// server/lib/handlers/organization/clientPayments.ts
import type { ProjectsContext } from '../projects/shared.js';
import { ensureAuth, ensureOrganizationAccess } from '../projects/shared.js';
import type { ClientPayment } from '../projects/clientPayments.js';

export interface ListOrganizationClientPaymentsParams {
  organizationId: string;
}

export type ListOrganizationClientPaymentsResult =
  | { success: true; data: (ClientPayment & { projects?: { id: string; name: string; color: string } | null })[] }
  | { success: false; error: string };

// Helper function to transform view data to expected structure (with project info)
function transformViewToClientPayment(row: any): ClientPayment & { projects?: { id: string; name: string; color: string } | null } {
  return {
    id: row.id,
    project_id: row.project_id,
    commitment_id: row.commitment_id,
    schedule_id: row.schedule_id,
    contact_id: row.contact_id,
    organization_id: row.organization_id,
    client_id: row.client_id,
    amount: row.amount,
    currency_id: row.currency_id,
    exchange_rate: row.exchange_rate,
    payment_date: row.payment_date,
    notes: row.notes,
    reference: row.reference,
    created_at: row.created_at,
    updated_at: row.updated_at,
    wallet_id: row.wallet_id,
    status: row.status,
    file_url: row.file_url,
    contact: row.contact_pk ? {
      id: row.contact_pk,
      first_name: row.contact_first_name,
      last_name: row.contact_last_name,
      full_name: row.contact_full_name,
      email: row.contact_email,
      phone: row.contact_phone,
      company_name: row.contact_company_name,
      linked_user: row.contact_linked_user_id ? {
        id: row.contact_linked_user_id,
        avatar_url: row.contact_avatar_url
      } : null
    } : null,
    project_client: row.project_client_pk ? {
      id: row.project_client_pk,
      unit: row.project_client_unit
    } : null,
    currency: row.currency_id ? {
      id: row.currency_id,
      code: row.currency_code,
      symbol: row.currency_symbol
    } : null,
    wallet: row.wallet_pk ? {
      id: row.wallet_pk,
      name: row.wallet_name
    } : null,
    commitment: row.commitment_id ? {
      id: row.commitment_id,
      amount: row.commitment_amount
    } : null,
    schedule: row.schedule_id ? {
      id: row.schedule_id,
      due_date: row.schedule_due_date,
      amount: row.schedule_amount
    } : null,
    projects: row.project_id ? {
      id: row.project_id,
      name: row.project_name,
      color: row.project_color
    } : null
  };
}

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

    // 🔍 DIRECT TABLE QUERIES: Query tables directly with JOINs (no views)
    // This helps debug data visibility issues
    const { data: payments, error } = await supabase
      .from('client_payments')
      .select(`
        *,
        contacts!contact_id (
          id,
          first_name,
          last_name,
          full_name,
          email,
          phone,
          company_name,
          users!linked_user_id (
            id,
            avatar_url
          )
        ),
        project_clients!client_id (
          id,
          unit
        ),
        currencies!currency_id (
          id,
          code,
          symbol
        ),
        projects!project_id (
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

    // Map response to match frontend expectations
    const mappedPayments = (payments || []).map((payment: any) => ({
      ...payment,
      contact: payment.contacts || null,
      project_client: payment.project_clients || null,
      currency: payment.currencies || null,
      projects: payment.projects || null,
      // Remove plural keys to avoid confusion
      contacts: undefined,
      project_clients: undefined,
      currencies: undefined,
    }));

    return { success: true, data: mappedPayments };

  } catch (error: any) {
    console.error('Error in listOrganizationClientPayments handler:', error);
    return { success: false, error: error.message || 'Failed to list organization client payments' };
  }
}
