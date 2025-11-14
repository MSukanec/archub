import { SupabaseClient } from '@supabase/supabase-js';

interface CreateClientRolePayload {
  name: string;
  organization_id: string;
}

export async function createClientRole(
  context: { supabase: SupabaseClient },
  payload: CreateClientRolePayload
) {
  const { supabase } = context;

  const { data, error } = await supabase
    .from('client_roles')
    .insert({
      name: payload.name,
      organization_id: payload.organization_id,
      is_default: false
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create client role: ${error.message}`);
  }

  return data;
}
