import type { SupabaseClient } from '@supabase/supabase-js';

export interface SubcontractsContext {
  supabase: SupabaseClient;
  user?: {
    id: string;
    email: string;
  };
}

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function getAuthenticatedUser(ctx: SubcontractsContext) {
  const { data: { user }, error } = await ctx.supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  const { data: dbUsers } = await ctx.supabase
    .from('users')
    .select('id, email')
    .eq('auth_id', user.id)
    .limit(1);

  return dbUsers && dbUsers.length > 0 ? dbUsers[0] : null;
}

export async function ensureAuth(ctx: SubcontractsContext): Promise<{ success: true; user: { id: string; email: string } } | { success: false; error: string }> {
  const user = await getAuthenticatedUser(ctx);
  
  if (!user) {
    return { success: false, error: 'Unauthorized: User not authenticated' };
  }

  return { success: true, user };
}

export async function ensureOrganizationAccess(
  ctx: SubcontractsContext,
  organizationId: string
): Promise<{ success: true; memberId: string } | { success: false; error: string }> {
  const authResult = await ensureAuth(ctx);
  
  if (!authResult.success) {
    return authResult;
  }

  const { data: memberships, error } = await ctx.supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', authResult.user.id)
    .limit(1);

  if (error) {
    console.error('Error checking organization membership:', error);
    return { success: false, error: 'Failed to verify organization access' };
  }

  const membership = memberships && memberships.length > 0 ? memberships[0] : null;

  if (!membership) {
    return { success: false, error: 'Forbidden: User does not have access to this organization' };
  }

  return { success: true, memberId: membership.id };
}
