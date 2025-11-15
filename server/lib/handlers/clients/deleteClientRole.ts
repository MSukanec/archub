import { SupabaseClient } from '@supabase/supabase-js';

export async function deleteClientRole(
  context: { supabase: SupabaseClient },
  roleId: string,
  organizationId: string
) {
  const { supabase } = context;

  // First verify the role belongs to this organization and is not a default role
  const { data: existingRole, error: fetchError } = await supabase
    .from('client_roles')
    .select('id, organization_id, is_default')
    .eq('id', roleId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch client role: ${fetchError.message}`);
  }

  if (!existingRole) {
    throw new Error('Client role not found');
  }

  if (existingRole.is_default) {
    throw new Error('Cannot delete system default roles');
  }

  if (existingRole.organization_id !== organizationId) {
    throw new Error('Cannot delete roles from other organizations');
  }

  // Check if role is in use by any project clients
  const { data: clientsUsingRole, error: usageError } = await supabase
    .from('project_clients')
    .select('id')
    .eq('client_role_id', roleId)
    .limit(1);

  if (usageError) {
    throw new Error(`Failed to check role usage: ${usageError.message}`);
  }

  if (clientsUsingRole && clientsUsingRole.length > 0) {
    throw new Error('Cannot delete role that is currently assigned to clients');
  }

  // Delete the role
  const { error } = await supabase
    .from('client_roles')
    .delete()
    .eq('id', roleId)
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to delete client role: ${error.message}`);
  }

  return { success: true };
}
