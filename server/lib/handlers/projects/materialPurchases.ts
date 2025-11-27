// server/lib/handlers/projects/materialPurchases.ts
import type { ProjectsContext } from './shared.js';
import { ensureAuth, ensureOrganizationAccess, getProjectById } from './shared.js';

export interface MaterialPurchase {
  id: string;
  project_id: string;
  organization_id: string;
  provider_id: string | null;
  invoice_number: string | null;
  document_type: 'invoice' | 'receipt' | 'ticket' | 'other';
  purchase_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency_id: string;
  exchange_rate: number | null;
  status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  provider?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
  } | null;
  currency?: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
  creator?: {
    id: string;
    user: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
}

export interface ListMaterialPurchasesParams {
  projectId: string;
  organizationId: string;
}

export type ListMaterialPurchasesResult =
  | { success: true; data: MaterialPurchase[] }
  | { success: false; error: string };

export interface GetMaterialPurchaseByIdParams {
  projectId: string;
  purchaseId: string;
  organizationId: string;
}

export type GetMaterialPurchaseByIdResult =
  | { success: true; data: MaterialPurchase }
  | { success: false; error: string };

export interface CreateMaterialPurchaseParams {
  projectId: string;
  organizationId: string;
  purchaseData: {
    provider_id?: string | null;
    invoice_number?: string | null;
    document_type?: 'invoice' | 'receipt' | 'ticket' | 'other';
    purchase_date: string;
    subtotal: number;
    tax_amount?: number;
    currency_id: string;
    exchange_rate?: number | null;
    status?: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
    notes?: string | null;
  };
}

export type CreateMaterialPurchaseResult =
  | { success: true; data: MaterialPurchase }
  | { success: false; error: string };

export interface UpdateMaterialPurchaseParams {
  projectId: string;
  purchaseId: string;
  organizationId: string;
  purchaseData: {
    provider_id?: string | null;
    invoice_number?: string | null;
    document_type?: 'invoice' | 'receipt' | 'ticket' | 'other';
    purchase_date?: string;
    subtotal?: number;
    tax_amount?: number;
    currency_id?: string;
    exchange_rate?: number | null;
    status?: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
    notes?: string | null;
  };
}

export type UpdateMaterialPurchaseResult =
  | { success: true; data: MaterialPurchase }
  | { success: false; error: string };

export interface DeleteMaterialPurchaseParams {
  projectId: string;
  purchaseId: string;
  organizationId: string;
}

export type DeleteMaterialPurchaseResult =
  | { success: true }
  | { success: false; error: string };

const VALID_STATUSES = ['pending', 'partially_paid', 'paid', 'cancelled'] as const;
const VALID_DOCUMENT_TYPES = ['invoice', 'receipt', 'ticket', 'other'] as const;

async function fetchPurchaseWithRelations(
  supabase: any,
  purchaseId: string,
  organizationId: string
): Promise<MaterialPurchase | null> {
  const { data: purchase, error } = await supabase
    .from('material_purchases')
    .select(`
      *,
      currency:currencies!currency_id (
        id,
        code,
        symbol,
        name
      ),
      creator:organization_members!created_by (
        id,
        users (
          id,
          full_name,
          avatar_url
        )
      ),
      project:projects!project_id (
        id,
        name
      )
    `)
    .eq('id', purchaseId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !purchase) return null;

  // Get provider contact if provider_id exists
  let provider = null;
  if (purchase.provider_id) {
    const { data: contactData } = await supabase
      .from('contacts')
      .select('id, full_name, company_name, first_name, last_name')
      .eq('id', purchase.provider_id)
      .single();
    
    provider = contactData || null;
  }

  return {
    ...purchase,
    provider,
    currency: purchase.currency || null,
    creator: purchase.creator ? {
      id: purchase.creator.id,
      user: purchase.creator.users || null
    } : null,
    project: purchase.project || null,
  };
}

export async function listMaterialPurchases(
  ctx: ProjectsContext,
  params: ListMaterialPurchasesParams
): Promise<ListMaterialPurchasesResult> {
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

    const { data: purchases, error } = await supabase
      .from('material_purchases')
      .select(`
        *,
        currency:currencies!currency_id (
          id,
          code,
          symbol,
          name
        ),
        creator:organization_members!created_by (
          id,
          users (
            id,
            full_name,
            avatar_url
          )
        ),
        project:projects!project_id (
          id,
          name
        )
      `)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching material purchases:', error);
      return { success: false, error: 'Failed to fetch material purchases' };
    }

    // Get all contacts for provider lookup
    const providerIds = (purchases || [])
      .map((p: any) => p.provider_id)
      .filter((id: any): id is string => id !== null && id !== undefined);
    
    let contactsMap = new Map<string, any>();
    if (providerIds.length > 0) {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, full_name, company_name, first_name, last_name')
        .in('id', Array.from(new Set(providerIds)));
      
      if (contacts) {
        contactsMap = new Map(contacts.map(c => [c.id, c]));
      }
    }

    const mappedPurchases = (purchases || []).map((purchase: any) => ({
      ...purchase,
      provider: purchase.provider_id ? (contactsMap.get(purchase.provider_id) || null) : null,
      currency: purchase.currency || null,
      creator: purchase.creator ? {
        id: purchase.creator.id,
        user: purchase.creator.users || null
      } : null,
      project: purchase.project || null,
    }));

    return { success: true, data: mappedPurchases };

  } catch (error: any) {
    console.error('Error in listMaterialPurchases handler:', error);
    return { success: false, error: error.message || 'Failed to list material purchases' };
  }
}

export async function getMaterialPurchaseById(
  ctx: ProjectsContext,
  params: GetMaterialPurchaseByIdParams
): Promise<GetMaterialPurchaseByIdResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.purchaseId || !params.organizationId) {
      return { success: false, error: 'projectId, purchaseId and organizationId are required' };
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

    const purchase = await fetchPurchaseWithRelations(supabase, params.purchaseId, params.organizationId);

    if (!purchase) {
      return { success: false, error: 'Material purchase not found' };
    }

    if (purchase.project_id !== params.projectId) {
      return { success: false, error: 'Forbidden' };
    }

    return { success: true, data: purchase };

  } catch (error: any) {
    console.error('Error in getMaterialPurchaseById handler:', error);
    return { success: false, error: error.message || 'Failed to get material purchase' };
  }
}

export async function createMaterialPurchase(
  ctx: ProjectsContext,
  params: CreateMaterialPurchaseParams
): Promise<CreateMaterialPurchaseResult> {
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

    const insertPayload = {
      project_id: params.projectId,
      organization_id: params.organizationId,
      provider_id: params.purchaseData.provider_id || null,
      invoice_number: params.purchaseData.invoice_number || null,
      document_type: params.purchaseData.document_type || 'invoice',
      purchase_date: params.purchaseData.purchase_date,
      subtotal: params.purchaseData.subtotal,
      tax_amount: params.purchaseData.tax_amount || 0,
      currency_id: params.purchaseData.currency_id,
      exchange_rate: params.purchaseData.exchange_rate || null,
      status: params.purchaseData.status || 'pending',
      notes: params.purchaseData.notes || null,
      created_by: orgAccessResult.memberId,
    };

    const { data: newPurchase, error: insertError } = await supabase
      .from('material_purchases')
      .insert([insertPayload])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating material purchase:', insertError);
      return { success: false, error: 'Failed to create material purchase' };
    }

    const createdPurchase = await fetchPurchaseWithRelations(supabase, newPurchase.id, params.organizationId);

    if (!createdPurchase) {
      return { success: false, error: 'Failed to fetch created material purchase' };
    }

    return { success: true, data: createdPurchase };

  } catch (error: any) {
    console.error('Error in createMaterialPurchase handler:', error);
    return { success: false, error: error.message || 'Failed to create material purchase' };
  }
}

export async function updateMaterialPurchase(
  ctx: ProjectsContext,
  params: UpdateMaterialPurchaseParams
): Promise<UpdateMaterialPurchaseResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.purchaseId || !params.organizationId) {
      return { success: false, error: 'projectId, purchaseId and organizationId are required' };
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

    const { data: existingPurchase, error: fetchError } = await supabase
      .from('material_purchases')
      .select('id, project_id, organization_id')
      .eq('id', params.purchaseId)
      .single();

    if (fetchError || !existingPurchase) {
      return { success: false, error: 'Material purchase not found' };
    }

    if (existingPurchase.project_id !== params.projectId || existingPurchase.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden' };
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };

    if (params.purchaseData.provider_id !== undefined) updatePayload.provider_id = params.purchaseData.provider_id;
    if (params.purchaseData.invoice_number !== undefined) updatePayload.invoice_number = params.purchaseData.invoice_number;
    if (params.purchaseData.document_type !== undefined) updatePayload.document_type = params.purchaseData.document_type;
    if (params.purchaseData.purchase_date !== undefined) updatePayload.purchase_date = params.purchaseData.purchase_date;
    if (params.purchaseData.subtotal !== undefined) updatePayload.subtotal = params.purchaseData.subtotal;
    if (params.purchaseData.tax_amount !== undefined) updatePayload.tax_amount = params.purchaseData.tax_amount;
    if (params.purchaseData.currency_id !== undefined) updatePayload.currency_id = params.purchaseData.currency_id;
    if (params.purchaseData.exchange_rate !== undefined) updatePayload.exchange_rate = params.purchaseData.exchange_rate;
    if (params.purchaseData.status !== undefined) updatePayload.status = params.purchaseData.status;
    if (params.purchaseData.notes !== undefined) updatePayload.notes = params.purchaseData.notes;

    const { error: updateError } = await supabase
      .from('material_purchases')
      .update(updatePayload)
      .eq('id', params.purchaseId);

    if (updateError) {
      console.error('Error updating material purchase:', updateError);
      return { success: false, error: 'Failed to update material purchase' };
    }

    const updatedPurchase = await fetchPurchaseWithRelations(supabase, params.purchaseId, params.organizationId);

    if (!updatedPurchase) {
      return { success: false, error: 'Failed to fetch updated material purchase' };
    }

    return { success: true, data: updatedPurchase };

  } catch (error: any) {
    console.error('Error in updateMaterialPurchase handler:', error);
    return { success: false, error: error.message || 'Failed to update material purchase' };
  }
}

export async function deleteMaterialPurchase(
  ctx: ProjectsContext,
  params: DeleteMaterialPurchaseParams
): Promise<DeleteMaterialPurchaseResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.purchaseId || !params.organizationId) {
      return { success: false, error: 'projectId, purchaseId and organizationId are required' };
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

    const { data: existingPurchase, error: fetchError } = await supabase
      .from('material_purchases')
      .select('id, project_id, organization_id')
      .eq('id', params.purchaseId)
      .single();

    if (fetchError || !existingPurchase) {
      return { success: false, error: 'Material purchase not found' };
    }

    if (existingPurchase.project_id !== params.projectId || existingPurchase.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden' };
    }

    const { error: deleteError } = await supabase
      .from('material_purchases')
      .delete()
      .eq('id', params.purchaseId);

    if (deleteError) {
      console.error('Error deleting material purchase:', deleteError);
      return { success: false, error: 'Failed to delete material purchase' };
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error in deleteMaterialPurchase handler:', error);
    return { success: false, error: error.message || 'Failed to delete material purchase' };
  }
}
