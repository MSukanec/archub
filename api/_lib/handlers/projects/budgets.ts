// api/_lib/handlers/projects/budgets.ts
import type { ProjectsContext } from './shared.js';
import { computeBudgetTotals, getBudgetItems, ensureAuth, ensureOrganizationAccess } from './shared.js';

export interface ListBudgetsParams {
  projectId: string;
  organizationId: string;
}

export interface CreateBudgetParams {
  project_id: string;
  organization_id: string;
  name?: string;
  currency_id?: string;
  [key: string]: any;
}

export interface UpdateBudgetParams {
  budgetId: string;
  [key: string]: any;
}

export interface DeleteBudgetParams {
  budgetId: string;
}

export type ListBudgetsResult =
  | { success: true; data: any[] }
  | { success: false; error: string };

export type CreateBudgetResult =
  | { success: true; data: any }
  | { success: false; error: string };

export type UpdateBudgetResult =
  | { success: true; data: any }
  | { success: false; error: string };

export type DeleteBudgetResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function listBudgets(
  ctx: ProjectsContext,
  params: ListBudgetsParams
): Promise<ListBudgetsResult> {
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

    const { data: budgets, error } = await supabase
      .from('budgets')
      .select(`
        *,
        currency:currencies!currency_id(id, code, name, symbol)
      `)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error);
      return { success: false, error: 'Failed to fetch budgets' };
    }

    // Calculate total for each budget
    const budgetsWithTotals = await Promise.all(
      (budgets || []).map(async (budget) => {
        const itemsResult = await getBudgetItems(ctx, budget.id);
        
        if (!itemsResult.success) {
          console.error(`Error fetching items for budget ${budget.id}`);
          return { ...budget, total: 0 };
        }

        const total = computeBudgetTotals(itemsResult.data);
        
        return {
          ...budget,
          total
        };
      })
    );

    return { success: true, data: budgetsWithTotals };

  } catch (error: any) {
    console.error('Error in listBudgets handler:', error);
    return { success: false, error: error.message || 'Failed to fetch budgets' };
  }
}

export async function createBudget(
  ctx: ProjectsContext,
  params: CreateBudgetParams
): Promise<CreateBudgetResult> {
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

    const { data: budget, error } = await supabase
      .from('budgets')
      .insert(params)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating budget:', error);
      return { success: false, error: 'Failed to create budget' };
    }

    if (!budget) {
      return { success: false, error: 'Failed to create budget - no data returned' };
    }

    return { success: true, data: budget };

  } catch (error: any) {
    console.error('Error in createBudget handler:', error);
    return { success: false, error: error.message || 'Failed to create budget' };
  }
}

export async function updateBudget(
  ctx: ProjectsContext,
  params: UpdateBudgetParams
): Promise<UpdateBudgetResult> {
  try {
    const { supabase } = ctx;

    if (!params.budgetId) {
      return { success: false, error: 'budgetId is required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const { data: existingBudget, error: fetchError } = await supabase
      .from('budgets')
      .select('organization_id')
      .eq('id', params.budgetId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching budget:', fetchError);
      return { success: false, error: 'Failed to fetch budget' };
    }

    if (!existingBudget) {
      return { success: false, error: 'Budget not found' };
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, existingBudget.organization_id);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const { budgetId, ...updateData } = params;

    const { data: budget, error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', budgetId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating budget:', error);
      return { success: false, error: 'Failed to update budget' };
    }

    if (!budget) {
      return { success: false, error: 'Budget not found' };
    }

    return { success: true, data: budget };

  } catch (error: any) {
    console.error('Error in updateBudget handler:', error);
    return { success: false, error: error.message || 'Failed to update budget' };
  }
}

export async function deleteBudget(
  ctx: ProjectsContext,
  params: DeleteBudgetParams
): Promise<DeleteBudgetResult> {
  try {
    const { supabase } = ctx;

    if (!params.budgetId) {
      return { success: false, error: 'budgetId is required' };
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

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', params.budgetId);

    if (error) {
      console.error('Error deleting budget:', error);
      return { success: false, error: 'Failed to delete budget' };
    }

    return { success: true, message: 'Budget deleted successfully' };

  } catch (error: any) {
    console.error('Error in deleteBudget handler:', error);
    return { success: false, error: error.message || 'Failed to delete budget' };
  }
}
