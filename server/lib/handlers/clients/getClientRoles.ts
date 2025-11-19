import type { SupabaseClient } from '@supabase/supabase-js';

interface GetClientRolesParams {
  organizationId: string;
}

export async function handleGetClientRoles(
  params: GetClientRolesParams,
  supabase: SupabaseClient
) {
  try {
    const { organizationId } = params;

    if (!organizationId) {
      return {
        success: false,
        error: 'organization_id is required'
      };
    }

    // Get client roles for the organization (including system roles), excluding soft-deleted ones
    // Query returns roles that match:
    // 1. (organization_id = X AND (is_deleted IS NULL OR is_deleted = false))
    // 2. (is_default = true AND (is_deleted IS NULL OR is_deleted = false))
    const { data: roles, error } = await supabase
      .from('client_roles')
      .select('*')
      .or(`and(organization_id.eq.${organizationId},or(is_deleted.is.null,is_deleted.eq.false)),and(is_default.eq.true,or(is_deleted.is.null,is_deleted.eq.false))`)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching client roles:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: roles || []
    };
  } catch (error: any) {
    console.error('Error in handleGetClientRoles:', error);
    return {
      success: false,
      error: error.message || 'Internal server error'
    };
  }
}
