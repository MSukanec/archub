// api/_lib/handlers/projects/shared.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProjectsContext {
  supabase: SupabaseClient;
  user?: {
    id: string;
    email: string;
  };
}

export interface BudgetItem {
  id: string;
  unit_price: number;
  quantity: number;
  markup_pct: number;
  tax_pct: number;
}

export function computeBudgetTotals(items: BudgetItem[]): number {
  let total = 0;

  for (const item of items) {
    const quantity = item.quantity || 1;
    const subtotal = (item.unit_price || 0) * quantity;
    const markupAmount = subtotal * ((item.markup_pct || 0) / 100);
    const taxableAmount = subtotal + markupAmount;
    const taxAmount = taxableAmount * ((item.tax_pct || 0) / 100);
    const itemTotal = taxableAmount + taxAmount;
    total += itemTotal;
  }

  return total;
}

export async function getAuthenticatedUser(ctx: ProjectsContext) {
  const { data: { user }, error } = await ctx.supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  const { data: dbUser } = await ctx.supabase
    .from('users')
    .select('id, email')
    .eq('auth_id', user.id)
    .maybeSingle();

  return dbUser;
}

export async function getProjectById(
  ctx: ProjectsContext,
  projectId: string
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  const { data: project, error } = await ctx.supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching project:', error);
    return { success: false, error: 'Failed to fetch project' };
  }

  if (!project) {
    return { success: false, error: 'Project not found' };
  }

  return { success: true, data: project };
}

export async function getBudgetById(
  ctx: ProjectsContext,
  budgetId: string
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  const { data: budget, error } = await ctx.supabase
    .from('budgets')
    .select('*')
    .eq('id', budgetId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching budget:', error);
    return { success: false, error: 'Failed to fetch budget' };
  }

  if (!budget) {
    return { success: false, error: 'Budget not found' };
  }

  return { success: true, data: budget };
}

export async function getBudgetItems(
  ctx: ProjectsContext,
  budgetId: string
): Promise<{ success: true; data: BudgetItem[] } | { success: false; error: string }> {
  const { data: items, error } = await ctx.supabase
    .from('budget_items')
    .select('id, unit_price, quantity, markup_pct, tax_pct')
    .eq('budget_id', budgetId);

  if (error) {
    console.error('Error fetching budget items:', error);
    return { success: false, error: 'Failed to fetch budget items' };
  }

  return { success: true, data: items || [] };
}
