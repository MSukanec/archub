// api/lib/handlers/projects/shared.ts
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
  console.log('🔍 [getAuthenticatedUser] START');
  const { data: { user }, error } = await ctx.supabase.auth.getUser();
  
  if (error || !user) {
    console.log('❌ [getAuthenticatedUser] No user or error:', error);
    return null;
  }
  console.log('✅ [getAuthenticatedUser] Auth user found:', user.id);

  const { data: dbUsers, error: dbError } = await ctx.supabase
    .from('users')
    .select('id, email')
    .eq('auth_id', user.id)
    .limit(1);

  if (dbError) {
    console.log('❌ [getAuthenticatedUser] DB query error:', dbError);
  } else {
    console.log('✅ [getAuthenticatedUser] DB users fetched, count:', dbUsers?.length || 0);
  }

  return dbUsers && dbUsers.length > 0 ? dbUsers[0] : null;
}

export async function ensureAuth(ctx: ProjectsContext): Promise<{ success: true; user: { id: string; email: string } } | { success: false; error: string }> {
  const user = await getAuthenticatedUser(ctx);
  
  if (!user) {
    return { success: false, error: 'Unauthorized: User not authenticated' };
  }

  return { success: true, user };
}

export async function ensureOrganizationAccess(
  ctx: ProjectsContext,
  organizationId: string
): Promise<{ success: true; memberId: string } | { success: false; error: string }> {
  console.log('🔍 [ensureOrganizationAccess] START - orgId:', organizationId);
  const authResult = await ensureAuth(ctx);
  
  if (!authResult.success) {
    console.log('❌ [ensureOrganizationAccess] Auth failed');
    return authResult;
  }
  console.log('✅ [ensureOrganizationAccess] Auth OK, userId:', authResult.user.id);

  console.log('🔍 [ensureOrganizationAccess] Querying organization_members...');
  const { data: memberships, error } = await ctx.supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', authResult.user.id)
    .limit(1);

  if (error) {
    console.error('❌ [ensureOrganizationAccess] Query error:', error);
    return { success: false, error: 'Failed to verify organization access' };
  }
  console.log('✅ [ensureOrganizationAccess] Memberships fetched, count:', memberships?.length || 0);

  const membership = memberships && memberships.length > 0 ? memberships[0] : null;

  if (!membership) {
    console.log('❌ [ensureOrganizationAccess] No membership found');
    return { success: false, error: 'Forbidden: User does not have access to this organization' };
  }

  console.log('✅ [ensureOrganizationAccess] Membership OK, memberId:', membership.id);
  return { success: true, memberId: membership.id };
}

export async function getProjectById(
  ctx: ProjectsContext,
  projectId: string
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  console.log('🔍 [getProjectById] START - projectId:', projectId);
  const { data: projects, error } = await ctx.supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .limit(1);

  if (error) {
    console.error('❌ [getProjectById] Query error:', error);
    return { success: false, error: 'Failed to fetch project' };
  }
  console.log('✅ [getProjectById] Projects fetched, count:', projects?.length || 0);

  const project = projects && projects.length > 0 ? projects[0] : null;

  if (!project) {
    console.log('❌ [getProjectById] No project found');
    return { success: false, error: 'Project not found' };
  }

  console.log('✅ [getProjectById] Project found, id:', project.id);
  return { success: true, data: project };
}

export async function getBudgetById(
  ctx: ProjectsContext,
  budgetId: string
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  const { data: budgets, error } = await ctx.supabase
    .from('budgets')
    .select('*')
    .eq('id', budgetId)
    .limit(1);

  if (error) {
    console.error('Error fetching budget:', error);
    return { success: false, error: 'Failed to fetch budget' };
  }

  const budget = budgets && budgets.length > 0 ? budgets[0] : null;

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
