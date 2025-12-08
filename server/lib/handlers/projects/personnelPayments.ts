// server/lib/handlers/projects/personnelPayments.ts
import type { ProjectsContext } from './shared.js';
import { ensureAuth, ensureOrganizationAccess, getProjectById } from './shared.js';

export interface ListPersonnelPaymentsParams {
  projectId: string;
  organizationId: string;
}

export interface PersonnelPayment {
  id: string;
  project_id: string;
  organization_id: string;
  personnel_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  wallet_id: string | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  currency: {
    id: string;
    code: string;
    symbol: string;
  } | null;
  wallet: {
    id: string;
    name: string;
  } | null;
  project: {
    id: string;
    name: string;
  } | null;
  personnel: {
    id: string;
    contact: {
      id: string;
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
    } | null;
  } | null;
  creator: {
    id: string;
    user: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  attachments?: Array<{
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
  }>;
}

export type ListPersonnelPaymentsResult =
  | { success: true; data: PersonnelPayment[] }
  | { success: false; error: string };

export interface GetPersonnelPaymentByIdParams {
  projectId: string;
  paymentId: string;
  organizationId: string;
}

export type GetPersonnelPaymentByIdResult =
  | { success: true; data: PersonnelPayment }
  | { success: false; error: string };

export interface DeletePersonnelPaymentParams {
  projectId: string;
  paymentId: string;
  organizationId: string;
}

export type DeletePersonnelPaymentResult =
  | { success: true }
  | { success: false; error: string };

export interface GetPersonnelPaymentAttachmentsParams {
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

export type GetPersonnelPaymentAttachmentsResult =
  | { success: true; data: PaymentAttachment[] }
  | { success: false; error: string };

export interface CreatePersonnelPaymentParams {
  projectId: string;
  organizationId: string;
  paymentData: {
    personnel_id?: string | null;
    amount: number;
    currency_id: string;
    exchange_rate?: number | null;
    payment_date: string;
    wallet_id?: string | null;
    notes?: string | null;
    reference?: string | null;
    status: 'confirmed' | 'pending' | 'rejected' | 'void';
  };
}

export type CreatePersonnelPaymentResult =
  | { success: true; data: PersonnelPayment }
  | { success: false; error: string };

export interface UpdatePersonnelPaymentParams {
  projectId: string;
  paymentId: string;
  organizationId: string;
  paymentData: {
    personnel_id?: string | null;
    amount?: number;
    currency_id?: string;
    exchange_rate?: number;
    payment_date?: string;
    wallet_id?: string | null;
    notes?: string | null;
    reference?: string | null;
    status?: 'confirmed' | 'pending' | 'rejected' | 'void';
  };
}

export type UpdatePersonnelPaymentResult =
  | { success: true; data: PersonnelPayment }
  | { success: false; error: string };

const PERSONNEL_PAYMENTS_SELECT = `
  *,
  currencies!currency_id (
    id,
    code,
    symbol
  ),
  organization_wallets!wallet_id (
    id,
    wallets (
      id,
      name
    )
  ),
  projects!project_id (
    id,
    name
  ),
  project_personnel!personnel_id (
    id,
    contacts!contact_id (
      id,
      full_name,
      first_name,
      last_name
    )
  ),
  organization_members!created_by (
    id,
    users (
      id,
      full_name,
      avatar_url
    )
  )
`;

function mapPaymentResponse(payment: any): PersonnelPayment {
  return {
    ...payment,
    currency: payment.currencies || null,
    wallet: payment.organization_wallets ? {
      id: payment.organization_wallets.id,
      name: payment.organization_wallets.wallets?.name || null
    } : null,
    project: payment.projects || null,
    personnel: payment.project_personnel ? {
      id: payment.project_personnel.id,
      contact: payment.project_personnel.contacts || null
    } : null,
    creator: payment.organization_members ? {
      id: payment.organization_members.id,
      user: payment.organization_members.users || null
    } : null,
    currencies: undefined,
    organization_wallets: undefined,
    projects: undefined,
    project_personnel: undefined,
    organization_members: undefined,
  };
}

export async function listPersonnelPayments(
  ctx: ProjectsContext,
  params: ListPersonnelPaymentsParams
): Promise<ListPersonnelPaymentsResult> {
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

    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    const { data: payments, error } = await supabase
      .from('personnel_payments')
      .select(PERSONNEL_PAYMENTS_SELECT)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching personnel payments:', error);
      return { success: false, error: 'Failed to fetch personnel payments' };
    }

    const paymentIds = (payments || []).map(p => p.id);
    let attachmentsMap: Record<string, any[]> = {};
    
    if (paymentIds.length > 0) {
      const { data: attachments, error: attachmentsError } = await supabase
        .from('media_links')
        .select(`
          id,
          personnel_payment_id,
          media_file:media_files (
            id,
            file_url,
            file_name,
            file_type
          )
        `)
        .in('personnel_payment_id', paymentIds)
        .eq('organization_id', params.organizationId);

      if (!attachmentsError && attachments) {
        attachments.forEach((att: any) => {
          if (!attachmentsMap[att.personnel_payment_id]) {
            attachmentsMap[att.personnel_payment_id] = [];
          }
          if (att.media_file) {
            attachmentsMap[att.personnel_payment_id].push({
              id: att.id,
              file_url: att.media_file.file_url,
              file_name: att.media_file.file_name,
              file_type: att.media_file.file_type,
            });
          }
        });
      }
    }

    const mappedPayments = (payments || []).map((payment: any) => ({
      ...mapPaymentResponse(payment),
      attachments: attachmentsMap[payment.id] || [],
    }));

    return { success: true, data: mappedPayments };

  } catch (error: any) {
    console.error('Error in listPersonnelPayments handler:', error);
    return { success: false, error: error.message || 'Failed to list personnel payments' };
  }
}

export async function getPersonnelPaymentById(
  ctx: ProjectsContext,
  params: GetPersonnelPaymentByIdParams
): Promise<GetPersonnelPaymentByIdResult> {
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

    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    const { data: payment, error } = await supabase
      .from('personnel_payments')
      .select(PERSONNEL_PAYMENTS_SELECT)
      .eq('id', params.paymentId)
      .single();

    if (error || !payment) {
      console.error('Error fetching personnel payment:', error);
      return { success: false, error: 'Payment not found' };
    }

    if (payment.project_id !== params.projectId || payment.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden' };
    }

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
      .eq('personnel_payment_id', params.paymentId)
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

    const mappedPayment: PersonnelPayment = {
      ...mapPaymentResponse(payment),
      attachments: mappedAttachments,
    };

    return { success: true, data: mappedPayment };

  } catch (error: any) {
    console.error('Error in getPersonnelPaymentById handler:', error);
    return { success: false, error: error.message || 'Failed to get personnel payment' };
  }
}

export async function createPersonnelPayment(
  ctx: ProjectsContext,
  params: CreatePersonnelPaymentParams
): Promise<CreatePersonnelPaymentResult> {
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

    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    const exchangeRate = params.paymentData.exchange_rate ?? 1;
    
    const { created_by: _ignored, ...paymentDataWithoutCreatedBy } = params.paymentData as any;

    const insertPayload = {
      ...paymentDataWithoutCreatedBy,
      project_id: params.projectId,
      organization_id: params.organizationId,
      exchange_rate: exchangeRate,
      created_by: orgAccessResult.memberId,
    };

    const { data: newPayment, error: insertError } = await supabase
      .from('personnel_payments')
      .insert([insertPayload])
      .select(PERSONNEL_PAYMENTS_SELECT)
      .single();

    if (insertError) {
      console.error('Error creating personnel payment:', insertError);
      return { success: false, error: 'Failed to create personnel payment' };
    }

    const normalizedPayment: PersonnelPayment = {
      ...mapPaymentResponse(newPayment),
      attachments: []
    };

    return { success: true, data: normalizedPayment };

  } catch (error: any) {
    console.error('Error in createPersonnelPayment handler:', error);
    return { success: false, error: error.message || 'Failed to create personnel payment' };
  }
}

export async function updatePersonnelPayment(
  ctx: ProjectsContext,
  params: UpdatePersonnelPaymentParams
): Promise<UpdatePersonnelPaymentResult> {
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

    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    const { data: existingPayment, error: fetchError } = await supabase
      .from('personnel_payments')
      .select('id, project_id, organization_id')
      .eq('id', params.paymentId)
      .single();

    if (fetchError || !existingPayment) {
      return { success: false, error: 'Payment not found' };
    }

    if (existingPayment.project_id !== params.projectId || existingPayment.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden' };
    }

    const { data: updatedPayment, error: updateError } = await supabase
      .from('personnel_payments')
      .update(params.paymentData)
      .eq('id', params.paymentId)
      .select(PERSONNEL_PAYMENTS_SELECT)
      .single();

    if (updateError) {
      console.error('Error updating personnel payment:', updateError);
      return { success: false, error: 'Failed to update personnel payment' };
    }

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
      .eq('personnel_payment_id', params.paymentId)
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

    const normalizedPayment: PersonnelPayment = {
      ...mapPaymentResponse(updatedPayment),
      attachments: mappedAttachments
    };

    return { success: true, data: normalizedPayment };

  } catch (error: any) {
    console.error('Error in updatePersonnelPayment handler:', error);
    return { success: false, error: error.message || 'Failed to update personnel payment' };
  }
}

export async function deletePersonnelPayment(
  ctx: ProjectsContext,
  params: DeletePersonnelPaymentParams
): Promise<DeletePersonnelPaymentResult> {
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

    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    const { data: existingPayment, error: fetchError } = await supabase
      .from('personnel_payments')
      .select('id, project_id, organization_id')
      .eq('id', params.paymentId)
      .single();

    if (fetchError || !existingPayment) {
      return { success: false, error: 'Payment not found' };
    }

    if (existingPayment.project_id !== params.projectId || existingPayment.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden' };
    }

    const { error: deleteError } = await supabase
      .from('personnel_payments')
      .delete()
      .eq('id', params.paymentId);

    if (deleteError) {
      console.error('Error deleting personnel payment:', deleteError);
      return { success: false, error: 'Failed to delete personnel payment' };
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error in deletePersonnelPayment handler:', error);
    return { success: false, error: error.message || 'Failed to delete personnel payment' };
  }
}

export async function getPersonnelPaymentAttachments(
  ctx: ProjectsContext,
  params: GetPersonnelPaymentAttachmentsParams
): Promise<GetPersonnelPaymentAttachmentsResult> {
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

    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    const { data: existingPayment, error: paymentError } = await supabase
      .from('personnel_payments')
      .select('id')
      .eq('id', params.paymentId)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .single();

    if (paymentError || !existingPayment) {
      return { success: false, error: 'Payment not found' };
    }

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
      .eq('personnel_payment_id', params.paymentId)
      .eq('organization_id', params.organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching payment attachments:', error);
      return { success: false, error: 'Failed to fetch payment attachments' };
    }

    const attachments: PaymentAttachment[] = (data || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      category: item.category,
      created_at: item.created_at,
      media_file: Array.isArray(item.media_file) && item.media_file.length > 0
        ? item.media_file[0]
        : item.media_file || null,
    }));

    return { success: true, data: attachments };

  } catch (error: any) {
    console.error('Error in getPersonnelPaymentAttachments handler:', error);
    return { success: false, error: error.message || 'Failed to get payment attachments' };
  }
}
