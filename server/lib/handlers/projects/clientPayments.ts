// server/lib/handlers/projects/clientPayments.ts
import type { ProjectsContext } from './shared.js';
import { ensureAuth, ensureOrganizationAccess, getProjectById } from './shared.js';

export interface ListClientPaymentsParams {
  projectId: string;
  organizationId: string;
}

export interface ClientPayment {
  id: string;
  project_id: string;
  commitment_id: string | null;
  schedule_id: string | null;
  contact_id: string;
  organization_id: string;
  client_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
  wallet_id: string | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  file_url: string | null;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone?: string;
    company_name?: string;
    linked_user?: {
      id: string;
      avatar_url?: string;
    } | null;
  } | null;
  project_client: {
    id: string;
    unit: string | null;
  } | null;
  currency: {
    id: string;
    code: string;
    symbol: string;
  } | null;
  wallet: {
    id: string;
    name: string;
  } | null;
  commitment: {
    id: string;
    amount: number;
  } | null;
  schedule: {
    id: string;
    due_date: string;
    amount: number;
  } | null;
}

export type ListClientPaymentsResult =
  | { success: true; data: ClientPayment[] }
  | { success: false; error: string };

export interface DeleteClientPaymentParams {
  projectId: string;
  paymentId: string;
  organizationId: string;
}

export type DeleteClientPaymentResult =
  | { success: true }
  | { success: false; error: string };

export interface CreateClientPaymentParams {
  projectId: string;
  organizationId: string;
  paymentData: {
    contact_id: string;
    client_id: string | null;
    amount: number;
    currency_id: string;
    exchange_rate: number;
    payment_date: string;
    wallet_id: string | null;
    notes: string | null;
    reference: string | null;
    status: 'confirmed' | 'pending' | 'rejected' | 'void';
    commitment_id: string | null;
    schedule_id: string | null;
    file_url: string | null;
  };
}

export type CreateClientPaymentResult =
  | { success: true; data: ClientPayment }
  | { success: false; error: string };

export interface UpdateClientPaymentParams {
  projectId: string;
  paymentId: string;
  organizationId: string;
  paymentData: {
    contact_id?: string;
    client_id?: string | null;
    amount?: number;
    currency_id?: string;
    exchange_rate?: number;
    payment_date?: string;
    wallet_id?: string | null;
    notes?: string | null;
    reference?: string | null;
    status?: 'confirmed' | 'pending' | 'rejected' | 'void';
    commitment_id?: string | null;
    schedule_id?: string | null;
    file_url?: string | null;
  };
}

export type UpdateClientPaymentResult =
  | { success: true; data: ClientPayment }
  | { success: false; error: string };

export async function listClientPayments(
  ctx: ProjectsContext,
  params: ListClientPaymentsParams
): Promise<ListClientPaymentsResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.organizationId) {
      return { success: false, error: 'projectId and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Verify project belongs to organization
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // Query client_payments with all necessary JOINs
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
        project_client:project_clients!client_id (
          id,
          unit,
          contacts:contacts!contact_id (
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
          )
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
        )
      `)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching client payments:', error);
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
    console.error('Error in listClientPayments handler:', error);
    return { success: false, error: error.message || 'Failed to list client payments' };
  }
}

export async function createClientPayment(
  ctx: ProjectsContext,
  params: CreateClientPaymentParams
): Promise<CreateClientPaymentResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.organizationId) {
      return { success: false, error: 'projectId and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Verify project belongs to organization
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // Create the payment
    const { data: newPayment, error: insertError } = await supabase
      .from('client_payments')
      .insert([{
        project_id: params.projectId,
        organization_id: params.organizationId,
        ...params.paymentData
      }])
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
        project_client:project_clients!client_id (
          id,
          unit,
          contacts:contacts!contact_id (
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
          )
        ),
        currency:currencies!currency_id (
          id,
          code,
          symbol
        ),
        wallet:organization_wallets!wallet_id (
          id,
          wallets (
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
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating client payment:', insertError);
      return { success: false, error: 'Failed to create client payment' };
    }

    // Normalize wallet structure
    const normalizedPayment = {
      ...newPayment,
      wallet: newPayment.wallet ? {
        id: newPayment.wallet.id,
        name: newPayment.wallet.wallets?.name || null
      } : null
    };

    return { success: true, data: normalizedPayment };

  } catch (error: any) {
    console.error('Error in createClientPayment handler:', error);
    return { success: false, error: error.message || 'Failed to create client payment' };
  }
}

export async function updateClientPayment(
  ctx: ProjectsContext,
  params: UpdateClientPaymentParams
): Promise<UpdateClientPaymentResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.paymentId || !params.organizationId) {
      return { success: false, error: 'projectId, paymentId and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Verify project belongs to organization
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // Verify the payment exists and belongs to this project
    const { data: existingPayment, error: fetchError } = await supabase
      .from('client_payments')
      .select('id, project_id, organization_id')
      .eq('id', params.paymentId)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .single();

    if (fetchError || !existingPayment) {
      return { success: false, error: 'Payment not found' };
    }

    // Update the payment
    const { data: updatedPayment, error: updateError } = await supabase
      .from('client_payments')
      .update(params.paymentData)
      .eq('id', params.paymentId)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
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
        project_client:project_clients!client_id (
          id,
          unit,
          contacts:contacts!contact_id (
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
          )
        ),
        currency:currencies!currency_id (
          id,
          code,
          symbol
        ),
        wallet:organization_wallets!wallet_id (
          id,
          wallets (
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
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating client payment:', updateError);
      return { success: false, error: 'Failed to update client payment' };
    }

    // Normalize wallet structure
    const normalizedPayment = {
      ...updatedPayment,
      wallet: updatedPayment.wallet ? {
        id: updatedPayment.wallet.id,
        name: updatedPayment.wallet.wallets?.name || null
      } : null
    };

    return { success: true, data: normalizedPayment };

  } catch (error: any) {
    console.error('Error in updateClientPayment handler:', error);
    return { success: false, error: error.message || 'Failed to update client payment' };
  }
}

export async function deleteClientPayment(
  ctx: ProjectsContext,
  params: DeleteClientPaymentParams
): Promise<DeleteClientPaymentResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.paymentId || !params.organizationId) {
      return { success: false, error: 'projectId, paymentId and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Verify project belongs to organization
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // First, verify the payment exists and belongs to this project
    const { data: existingPayment, error: fetchError } = await supabase
      .from('client_payments')
      .select('id, project_id, organization_id')
      .eq('id', params.paymentId)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .single();

    if (fetchError || !existingPayment) {
      return { success: false, error: 'Payment not found' };
    }

    // Delete the payment
    const { error: deleteError } = await supabase
      .from('client_payments')
      .delete()
      .eq('id', params.paymentId)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId);

    if (deleteError) {
      console.error('Error deleting client payment:', deleteError);
      return { success: false, error: 'Failed to delete client payment' };
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error in deleteClientPayment handler:', error);
    return { success: false, error: error.message || 'Failed to delete client payment' };
  }
}
