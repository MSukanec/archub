// server/lib/handlers/projects/materialPayments.ts
import type { ProjectsContext } from './shared.js';
import { ensureAuth, ensureOrganizationAccess, getProjectById } from './shared.js';

export interface ListMaterialPaymentsParams {
  projectId: string;
  organizationId: string;
}

export interface MaterialPayment {
  id: string;
  project_id: string;
  organization_id: string;
  purchase_id: string | null;
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

export type ListMaterialPaymentsResult =
  | { success: true; data: MaterialPayment[] }
  | { success: false; error: string };

export interface GetMaterialPaymentByIdParams {
  projectId: string;
  paymentId: string;
  organizationId: string;
}

export type GetMaterialPaymentByIdResult =
  | { success: true; data: MaterialPayment }
  | { success: false; error: string };

export interface DeleteMaterialPaymentParams {
  projectId: string;
  paymentId: string;
  organizationId: string;
}

export type DeleteMaterialPaymentResult =
  | { success: true }
  | { success: false; error: string };

export interface GetMaterialPaymentAttachmentsParams {
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

export type GetMaterialPaymentAttachmentsResult =
  | { success: true; data: PaymentAttachment[] }
  | { success: false; error: string };

export interface CreateMaterialPaymentParams {
  projectId: string;
  organizationId: string;
  paymentData: {
    purchase_id?: string | null;
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

export type CreateMaterialPaymentResult =
  | { success: true; data: MaterialPayment }
  | { success: false; error: string };

export interface UpdateMaterialPaymentParams {
  projectId: string;
  paymentId: string;
  organizationId: string;
  paymentData: {
    purchase_id?: string | null;
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

export type UpdateMaterialPaymentResult =
  | { success: true; data: MaterialPayment }
  | { success: false; error: string };

export async function listMaterialPayments(
  ctx: ProjectsContext,
  params: ListMaterialPaymentsParams
): Promise<ListMaterialPaymentsResult> {
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
      .from('material_payments')
      .select(`
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
        organization_members!created_by (
          id,
          users (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching material payments:', error);
      return { success: false, error: 'Failed to fetch material payments' };
    }

    const paymentIds = (payments || []).map(p => p.id);
    let attachmentsMap: Record<string, any[]> = {};
    
    if (paymentIds.length > 0) {
      const { data: attachments, error: attachmentsError } = await supabase
        .from('media_links')
        .select(`
          id,
          material_payment_id,
          media_file:media_files (
            id,
            file_url,
            file_name,
            file_type
          )
        `)
        .in('material_payment_id', paymentIds)
        .eq('organization_id', params.organizationId);

      if (!attachmentsError && attachments) {
        attachments.forEach((att: any) => {
          if (!attachmentsMap[att.material_payment_id]) {
            attachmentsMap[att.material_payment_id] = [];
          }
          if (att.media_file) {
            attachmentsMap[att.material_payment_id].push({
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
      ...payment,
      currency: payment.currencies || null,
      wallet: payment.organization_wallets ? {
        id: payment.organization_wallets.id,
        name: payment.organization_wallets.wallets?.name || null
      } : null,
      project: payment.projects || null,
      creator: payment.organization_members ? {
        id: payment.organization_members.id,
        user: payment.organization_members.users || null
      } : null,
      attachments: attachmentsMap[payment.id] || [],
      currencies: undefined,
      organization_wallets: undefined,
      projects: undefined,
      organization_members: undefined,
    }));

    return { success: true, data: mappedPayments };

  } catch (error: any) {
    console.error('Error in listMaterialPayments handler:', error);
    return { success: false, error: error.message || 'Failed to list material payments' };
  }
}

export async function getMaterialPaymentById(
  ctx: ProjectsContext,
  params: GetMaterialPaymentByIdParams
): Promise<GetMaterialPaymentByIdResult> {
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
      .from('material_payments')
      .select(`
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
        organization_members!created_by (
          id,
          users (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', params.paymentId)
      .single();

    if (error || !payment) {
      console.error('Error fetching material payment:', error);
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
      .eq('material_payment_id', params.paymentId)
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

    const mappedPayment: MaterialPayment = {
      ...payment,
      currency: payment.currencies || null,
      wallet: payment.organization_wallets ? {
        id: payment.organization_wallets.id,
        name: payment.organization_wallets.wallets?.name || null
      } : null,
      project: payment.projects || null,
      creator: payment.organization_members ? {
        id: payment.organization_members.id,
        user: payment.organization_members.users || null
      } : null,
      attachments: mappedAttachments,
    };

    return { success: true, data: mappedPayment };

  } catch (error: any) {
    console.error('Error in getMaterialPaymentById handler:', error);
    return { success: false, error: error.message || 'Failed to get material payment' };
  }
}

export async function createMaterialPayment(
  ctx: ProjectsContext,
  params: CreateMaterialPaymentParams
): Promise<CreateMaterialPaymentResult> {
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
    
    console.log('Inserting material payment with payload:', JSON.stringify(insertPayload, null, 2));

    const { data: newPayment, error: insertError } = await supabase
      .from('material_payments')
      .insert([insertPayload])
      .select(`
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
        organization_members!created_by (
          id,
          users (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating material payment:', insertError);
      return { success: false, error: 'Failed to create material payment' };
    }

    const normalizedPayment: MaterialPayment = {
      ...newPayment,
      currency: newPayment.currencies || null,
      wallet: newPayment.organization_wallets ? {
        id: newPayment.organization_wallets.id,
        name: newPayment.organization_wallets.wallets?.name || null
      } : null,
      project: newPayment.projects || null,
      creator: newPayment.organization_members ? {
        id: newPayment.organization_members.id,
        user: newPayment.organization_members.users || null
      } : null,
      attachments: []
    };

    return { success: true, data: normalizedPayment };

  } catch (error: any) {
    console.error('Error in createMaterialPayment handler:', error);
    return { success: false, error: error.message || 'Failed to create material payment' };
  }
}

export async function updateMaterialPayment(
  ctx: ProjectsContext,
  params: UpdateMaterialPaymentParams
): Promise<UpdateMaterialPaymentResult> {
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
      .from('material_payments')
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
      .from('material_payments')
      .update(params.paymentData)
      .eq('id', params.paymentId)
      .select(`
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
        organization_members!created_by (
          id,
          users (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating material payment:', updateError);
      return { success: false, error: 'Failed to update material payment' };
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
      .eq('material_payment_id', params.paymentId)
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

    const normalizedPayment: MaterialPayment = {
      ...updatedPayment,
      currency: updatedPayment.currencies || null,
      wallet: updatedPayment.organization_wallets ? {
        id: updatedPayment.organization_wallets.id,
        name: updatedPayment.organization_wallets.wallets?.name || null
      } : null,
      project: updatedPayment.projects || null,
      creator: updatedPayment.organization_members ? {
        id: updatedPayment.organization_members.id,
        user: updatedPayment.organization_members.users || null
      } : null,
      attachments: mappedAttachments
    };

    return { success: true, data: normalizedPayment };

  } catch (error: any) {
    console.error('Error in updateMaterialPayment handler:', error);
    return { success: false, error: error.message || 'Failed to update material payment' };
  }
}

export async function deleteMaterialPayment(
  ctx: ProjectsContext,
  params: DeleteMaterialPaymentParams
): Promise<DeleteMaterialPaymentResult> {
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
      .from('material_payments')
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
      .from('material_payments')
      .delete()
      .eq('id', params.paymentId);

    if (deleteError) {
      console.error('Error deleting material payment:', deleteError);
      return { success: false, error: 'Failed to delete material payment' };
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error in deleteMaterialPayment handler:', error);
    return { success: false, error: error.message || 'Failed to delete material payment' };
  }
}

export async function getMaterialPaymentAttachments(
  ctx: ProjectsContext,
  params: GetMaterialPaymentAttachmentsParams
): Promise<GetMaterialPaymentAttachmentsResult> {
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
      .from('material_payments')
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
      .eq('material_payment_id', params.paymentId)
      .eq('organization_id', params.organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching payment attachments:', error);
      return { success: false, error: 'Failed to fetch payment attachments' };
    }

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
    console.error('Error in getMaterialPaymentAttachments handler:', error);
    return { success: false, error: error.message || 'Failed to get payment attachments' };
  }
}
