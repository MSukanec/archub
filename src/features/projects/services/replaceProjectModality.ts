import { supabase } from '@/lib/supabase';
/**
 * Reemplaza todas las referencias de una modalidad de proyecto por otra
 * Luego soft deletes la modalidad antigua
 */
export async function replaceProjectModality(
  oldModalityId: string,
  newModalityId: string,
  organizationId: string
) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  if (!oldModalityId || !newModalityId || !organizationId) {
    throw new Error('Missing required parameters');
  }
  // Update all projects that reference the old modality to use the new modality
  const { error: updateError } = await supabase
    .from('project_data')
    .update({ project_modality_id: newModalityId })
    .eq('project_modality_id', oldModalityId);
  if (updateError) {
    console.error('Error updating projects:', updateError);
    throw updateError;
  }
  // Soft delete the old modality
  const { error: deleteError } = await supabase
    .from('project_modalities')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', oldModalityId)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false);
  if (deleteError) {
    console.error('Error deleting project modality:', deleteError);
    throw deleteError;
  }
}
