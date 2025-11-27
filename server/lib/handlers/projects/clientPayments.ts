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
  attachments?: Array<{
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
  }>;
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

export interface GetClientPaymentAttachmentsParams {
  projectId: string;
  paymentId: string;
  organizationId: string;
}

export interface PaymentAttachment {
  id: string;
  description: string | null;
  category: string | null;
  created_at: string;
  media_file: {
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
  } | null;
}

interface RawPaymentAttachment {
  id: string;
  description: string | null;
  category: string | null;
  created_at: string;
  media_file: {
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
  }[] | null;
}

export type GetClientPaymentAttachmentsResult =
  | { success: true; data: PaymentAttachment[] }
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
  };
}

export type UpdateClientPaymentResult =
  | { success: true; data: ClientPayment }
  | { success: false; error: string };

// Helper function to transform view data to expected structure
function transformViewToClientPayment(row: any): ClientPayment {
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
    } : null
  };
}

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
        )
      `)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching client payments:', error);
      return { success: false, error: 'Failed to fetch client payments' };
    }

    // Fetch attachments for all payments in a single query
    const paymentIds = (payments || []).map(p => p.id);
    let attachmentsMap: Record<string, any[]> = {};
    
    if (paymentIds.length > 0) {
      const { data: attachments, error: attachmentsError } = await supabase
        .from('media_links')
        .select(`
          id,
          client_payment_id,
          media_file:media_files (
            id,
            file_url,
            file_name,
            file_type
          )
        `)
        .in('client_payment_id', paymentIds)
        .eq('organization_id', params.organizationId);

      if (!attachmentsError && attachments) {
        // Group attachments by payment ID
        attachments.forEach((att: any) => {
          if (!attachmentsMap[att.client_payment_id]) {
            attachmentsMap[att.client_payment_id] = [];
          }
          if (att.media_file) {
            attachmentsMap[att.client_payment_id].push({
              id: att.id,
              file_url: att.media_file.file_url,
              file_name: att.media_file.file_name,
              file_type: att.media_file.file_type,
            });
          }
        });
      }
    }

    // Map response to match frontend expectations
    const mappedPayments = (payments || []).map((payment: any) => ({
      ...payment,
      contact: payment.contacts || null,
      project_client: payment.project_clients || null,
      currency: payment.currencies || null,
      attachments: attachmentsMap[payment.id] || [],
      // Remove plural keys to avoid confusion
      contacts: undefined,
      project_clients: undefined,
      currencies: undefined,
    }));

    return { success: true, data: mappedPayments };

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
        project_client:project_clients (
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

    // Normalize wallet structure and add empty attachments (will be uploaded separately)
    const normalizedPayment = {
      ...newPayment,
      wallet: newPayment.wallet ? {
        id: newPayment.wallet.id,
        name: newPayment.wallet.wallets?.name || null
      } : null,
      attachments: []
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
        project_client:project_clients (
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

    // Fetch attachments for the updated payment
    const { data: attachments, error: attachmentsError } = await supabase
      .from('media_links')
      .select(`
        id,
        media_file:media_files (
          id,
          file_url,
          file_name,
          file_type
        )
      `)
      .eq('client_payment_id', params.paymentId)
      .eq('organization_id', params.organizationId);

    const mappedAttachments = (!attachmentsError && attachments)
      ? attachments
          .filter((att: any) => att.media_file)
          .map((att: any) => ({
            id: att.id,
            file_url: att.media_file.file_url,
            file_name: att.media_file.file_name,
            file_type: att.media_file.file_type,
          }))
      : [];

    // Normalize wallet structure and add attachments
    const normalizedPayment = {
      ...updatedPayment,
      wallet: updatedPayment.wallet ? {
        id: updatedPayment.wallet.id,
        name: updatedPayment.wallet.wallets?.name || null
      } : null,
      attachments: mappedAttachments
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

export async function getClientPaymentAttachments(
  ctx: ProjectsContext,
  params: GetClientPaymentAttachmentsParams
): Promise<GetClientPaymentAttachmentsResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.paymentId || !params.organizationId) {
      return { success: false, error: 'projectId, paymentId, and organizationId are required' };
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

    // Verify payment exists and belongs to this project
    const { data: existingPayment, error: paymentError } = await supabase
      .from('client_payments')
      .select('id')
      .eq('id', params.paymentId)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .single();

    if (paymentError || !existingPayment) {
      return { success: false, error: 'Payment not found' };
    }

    // Fetch attachments from media_links
    const { data, error } = await supabase
      .from('media_links')
      .select(`
        id,
        description,
        category,
        created_at,
        media_file:media_files (
          id,
          file_url,
          file_name,
          file_type,
          file_size
        )
      `)
      .eq('client_payment_id', params.paymentId)
      .eq('organization_id', params.organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching payment attachments:', error);
      return { success: false, error: 'Failed to fetch payment attachments' };
    }

    // Transform the data to handle Supabase's array response for relations
    const transformedData: PaymentAttachment[] = ((data || []) as RawPaymentAttachment[]).map(item => ({
      id: item.id,
      description: item.description,
      category: item.category,
      created_at: item.created_at,
      media_file: Array.isArray(item.media_file) && item.media_file.length > 0
        ? item.media_file[0]
        : null
    }));

    return { success: true, data: transformedData };

  } catch (error: any) {
    console.error('Error in getClientPaymentAttachments handler:', error);
    return { success: false, error: error.message || 'Failed to get payment attachments' };
  }
}
