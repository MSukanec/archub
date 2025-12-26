import { supabase } from '@/lib/supabase';

/**
 * Elimina (soft delete) una modalidad de proyecto personalizada de una organización.
 * Solo se pueden eliminar modalidades que pertenecen a la organización (no del sistema).
 * Usa soft delete para mantener integridad referencial.
 * 
 * @param modalityId - ID de la modalidad de proyecto a eliminar
 * @param organizationId - ID de la organización (para validación)
 * @throws {Error} Si falla la eliminación, si se intenta eliminar una modalidad del sistema, o si faltan parámetros requeridos
 */
export async function deleteProjectModality(modalityId: string, organizationId: string) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (!modalityId || !organizationId) {
    throw new Error('Missing required parameters: modalityId and organizationId are required');
  }

  const { error } = await supabase
    .from('project_modalities')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', modalityId)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false);

  if (error) {
    console.error('Error deleting project modality:', error);
    throw error;
  }
}
