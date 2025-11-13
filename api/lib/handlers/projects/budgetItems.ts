// api/lib/handlers/projects/budgetItems.ts
import type { ProjectsContext } from './shared.js';
import { ensureAuth, ensureOrganizationAccess } from './shared.js';

export interface ListBudgetItemsParams {
  budgetId: string;
  organizationId: string;
}

export interface CreateBudgetItemParams {
  budget_id: string;
  organization_id: string;
  [key: string]: any;
}

export interface UpdateBudgetItemParams {
  itemId: string;
  [key: string]: any;
}

export interface DeleteBudgetItemParams {
  itemId: string;
}

export interface MoveBudgetItemParams {
  budgetId: string;
  itemId: string;
  prevItemId?: string | null;
  nextItemId?: string | null;
}

export type ListBudgetItemsResult =
  | { success: true; data: any[] }
  | { success: false; error: string };

export type CreateBudgetItemResult =
  | { success: true; data: any }
  | { success: false; error: string };

export type UpdateBudgetItemResult =
  | { success: true; data: any }
  | { success: false; error: string };

export type DeleteBudgetItemResult =
  | { success: true; message: string }
  | { success: false; error: string };

export type MoveBudgetItemResult =
  | { success: true; data: any }
  | { success: false; error: string };

export async function listBudgetItems(
  ctx: ProjectsContext,
  params: ListBudgetItemsParams
): Promise<ListBudgetItemsResult> {
  try {
    const { supabase } = ctx;

    if (!params.budgetId || !params.organizationId) {
      return { success: false, error: 'budgetId and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const { data: budgetItems, error } = await supabase
      .from('budget_items_view')
      .select('*, position')
      .eq('budget_id', params.budgetId)
      .eq('organization_id', params.organizationId)
      .order('position', { ascending: true })
      .order('division_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching budget items:', error);
      return { success: false, error: 'Failed to fetch budget items' };
    }

    return { success: true, data: budgetItems || [] };

  } catch (error: any) {
    console.error('Error in listBudgetItems handler:', error);
    return { success: false, error: error.message || 'Failed to fetch budget items' };
  }
}

export async function createBudgetItem(
  ctx: ProjectsContext,
  params: CreateBudgetItemParams
): Promise<CreateBudgetItemResult> {
  try {
    const { supabase } = ctx;

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    if (params.organization_id) {
      const orgAccessResult = await ensureOrganizationAccess(ctx, params.organization_id);
      if (!orgAccessResult.success) {
        return orgAccessResult;
      }
    }

    const { data: budgetItem, error } = await supabase
      .from('budget_items')
      .insert(params)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating budget item:', error);
      return { success: false, error: 'Failed to create budget item' };
    }

    if (!budgetItem) {
      return { success: false, error: 'Failed to create budget item - no data returned' };
    }

    return { success: true, data: budgetItem };

  } catch (error: any) {
    console.error('Error in createBudgetItem handler:', error);
    return { success: false, error: error.message || 'Failed to create budget item' };
  }
}

export async function updateBudgetItem(
  ctx: ProjectsContext,
  params: UpdateBudgetItemParams
): Promise<UpdateBudgetItemResult> {
  try {
    const { supabase } = ctx;

    if (!params.itemId) {
      return { success: false, error: 'itemId is required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const { data: existingItem, error: fetchError } = await supabase
      .from('budget_items')
      .select('organization_id')
      .eq('id', params.itemId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching budget item:', fetchError);
      return { success: false, error: 'Failed to fetch budget item' };
    }

    if (!existingItem) {
      return { success: false, error: 'Budget item not found' };
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, existingItem.organization_id);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const { itemId, ...updateData } = params;

    const { data: budgetItem, error } = await supabase
      .from('budget_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating budget item:', error);
      return { success: false, error: 'Failed to update budget item' };
    }

    if (!budgetItem) {
      return { success: false, error: 'Budget item not found' };
    }

    return { success: true, data: budgetItem };

  } catch (error: any) {
    console.error('Error in updateBudgetItem handler:', error);
    return { success: false, error: error.message || 'Failed to update budget item' };
  }
}

export async function deleteBudgetItem(
  ctx: ProjectsContext,
  params: DeleteBudgetItemParams
): Promise<DeleteBudgetItemResult> {
  try {
    const { supabase } = ctx;

    if (!params.itemId) {
      return { success: false, error: 'itemId is required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const { data: budgetItem, error: fetchError } = await supabase
      .from('budget_items')
      .select('organization_id')
      .eq('id', params.itemId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching budget item:', fetchError);
      return { success: false, error: 'Failed to fetch budget item' };
    }

    if (!budgetItem) {
      return { success: false, error: 'Budget item not found' };
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, budgetItem.organization_id);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', params.itemId);

    if (error) {
      console.error('Error deleting budget item:', error);
      return { success: false, error: 'Failed to delete budget item' };
    }

    return { success: true, message: 'Budget item deleted successfully' };

  } catch (error: any) {
    console.error('Error in deleteBudgetItem handler:', error);
    return { success: false, error: error.message || 'Failed to delete budget item' };
  }
}

export async function moveBudgetItem(
  ctx: ProjectsContext,
  params: MoveBudgetItemParams
): Promise<MoveBudgetItemResult> {
  try {
    const { supabase } = ctx;

    if (!params.budgetId || !params.itemId) {
      return { success: false, error: 'budgetId and itemId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const { data: budget, error: fetchError } = await supabase
      .from('budgets')
      .select('organization_id')
      .eq('id', params.budgetId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching budget:', fetchError);
      return { success: false, error: 'Failed to fetch budget' };
    }

    if (!budget) {
      return { success: false, error: 'Budget not found' };
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, budget.organization_id);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const { data, error } = await supabase.rpc('budget_item_move', {
      p_budget_id: params.budgetId,
      p_item_id: params.itemId,
      p_prev_item_id: params.prevItemId || null,
      p_next_item_id: params.nextItemId || null
    });

    if (error) {
      console.error('Error moving budget item:', error);
      return { success: false, error: 'Failed to move budget item' };
    }

    return { success: true, data };

  } catch (error: any) {
    console.error('Error in moveBudgetItem handler:', error);
    return { success: false, error: error.message || 'Failed to move budget item' };
  }
}
