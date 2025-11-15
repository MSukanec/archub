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

    // Get client roles for the organization (including global roles)
    const { data: roles, error } = await supabase
      .from('client_roles')
      .select('*')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
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
