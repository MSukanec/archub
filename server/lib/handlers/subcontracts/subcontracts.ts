import type { SubcontractsContext, Result } from './shared.js';
import { ensureAuth, ensureOrganizationAccess } from './shared.js';

export interface CreateSubcontractParams {
  organization_id: string;
  project_id: string;
  title: string;
  date: string;
  code?: string;
  contact_id?: string;
  currency_id?: string;
  amount_total?: number;
  exchange_rate?: number;
  status?: string;
  notes?: string;
}

export interface UpdateSubcontractParams {
  subcontractId: string;
  title?: string;
  date?: string;
  code?: string;
  contact_id?: string;
  currency_id?: string;
  amount_total?: number;
  exchange_rate?: number;
  status?: string;
  notes?: string;
  organization_id: string;
}

export interface DeleteSubcontractParams {
  subcontractId: string;
  organizationId: string;
}

export async function createSubcontract(
  ctx: SubcontractsContext,
  params: CreateSubcontractParams
): Promise<Result<any>> {
  try {
    const { supabase } = ctx;

    if (!params.organization_id || !params.project_id || !params.title || !params.date) {
      return { success: false, error: 'organization_id, project_id, title, and date are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organization_id);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const { data, error } = await supabase
      .from('subcontracts')
      .insert({
        organization_id: params.organization_id,
        project_id: params.project_id,
        title: params.title,
        date: params.date,
        code: params.code || null,
        contact_id: params.contact_id || null,
        currency_id: params.currency_id || null,
        amount_total: params.amount_total || null,
        exchange_rate: params.exchange_rate || null,
        status: params.status || 'draft',
        notes: params.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subcontract:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Exception in createSubcontract:', error);
    return { success: false, error: error.message || 'Failed to create subcontract' };
  }
}

export async function updateSubcontract(
  ctx: SubcontractsContext,
  params: UpdateSubcontractParams
): Promise<Result<any>> {
  try {
    const { supabase } = ctx;

    if (!params.subcontractId) {
      return { success: false, error: 'subcontractId is required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const { data: existing, error: fetchError } = await supabase
      .from('subcontracts')
      .select('organization_id')
      .eq('id', params.subcontractId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Subcontract not found' };
    }

    if (existing.organization_id !== params.organization_id) {
      return { success: false, error: 'Unauthorized' };
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organization_id);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const updateData: any = {};
    if (params.title !== undefined) updateData.title = params.title;
    if (params.date !== undefined) updateData.date = params.date;
    if (params.code !== undefined) updateData.code = params.code;
    if (params.contact_id !== undefined) updateData.contact_id = params.contact_id;
    if (params.currency_id !== undefined) updateData.currency_id = params.currency_id;
    if (params.amount_total !== undefined) updateData.amount_total = params.amount_total;
    if (params.exchange_rate !== undefined) updateData.exchange_rate = params.exchange_rate;
    if (params.status !== undefined) updateData.status = params.status;
    if (params.notes !== undefined) updateData.notes = params.notes;

    const { data, error } = await supabase
      .from('subcontracts')
      .update(updateData)
      .eq('id', params.subcontractId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subcontract:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Exception in updateSubcontract:', error);
    return { success: false, error: error.message || 'Failed to update subcontract' };
  }
}

export async function deleteSubcontract(
  ctx: SubcontractsContext,
  params: DeleteSubcontractParams
): Promise<Result<void>> {
  try {
    const { supabase } = ctx;

    if (!params.subcontractId || !params.organizationId) {
      return { success: false, error: 'subcontractId and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const { data: existing, error: fetchError } = await supabase
      .from('subcontracts')
      .select('organization_id')
      .eq('id', params.subcontractId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Subcontract not found' };
    }

    if (existing.organization_id !== params.organizationId) {
      return { success: false, error: 'Unauthorized' };
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const { error } = await supabase
      .from('subcontracts')
      .delete()
      .eq('id', params.subcontractId);

    if (error) {
      console.error('Error deleting subcontract:', error);
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Subcontract deleted successfully' };
  } catch (error: any) {
    console.error('Exception in deleteSubcontract:', error);
    return { success: false, error: error.message || 'Failed to delete subcontract' };
  }
}
