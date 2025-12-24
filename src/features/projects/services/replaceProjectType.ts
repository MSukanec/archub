import { supabase } from '@/lib/supabase';

/**
 * Reemplaza todas las referencias de un tipo de proyecto por otro
 * Luego soft deletes el tipo antiguo
 */
export async function replaceProjectType(
  oldTypeId: string,
  newTypeId: string,
  organizationId: string
) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (!oldTypeId || !newTypeId || !organizationId) {
    throw new Error('Missing required parameters');
  }

  // Update all projects that reference the old type to use the new type
  const { error: updateError } = await supabase
    .from('project_data')
    .update({ project_type_id: newTypeId })
    .eq('project_type_id', oldTypeId);

  if (updateError) {
    console.error('Error updating projects:', updateError);
    throw updateError;
  }

  // Soft delete the old type
  const { error: deleteError } = await supabase
    .from('project_types')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', oldTypeId)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false);

  if (deleteError) {
    console.error('Error deleting project type:', deleteError);
    throw deleteError;
  }
}
