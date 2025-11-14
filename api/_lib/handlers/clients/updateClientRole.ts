import { SupabaseClient } from '@supabase/supabase-js';

interface UpdateClientRolePayload {
  name: string;
}

export async function updateClientRole(
  context: { supabase: SupabaseClient },
  roleId: string,
  organizationId: string,
  payload: UpdateClientRolePayload
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
    throw new Error('Cannot modify system default roles');
  }

  if (existingRole.organization_id !== organizationId) {
    throw new Error('Cannot modify roles from other organizations');
  }

  // Update the role
  const { data, error } = await supabase
    .from('client_roles')
    .update({
      name: payload.name,
      updated_at: new Date().toISOString()
    })
    .eq('id', roleId)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update client role: ${error.message}`);
  }

  return data;
}
