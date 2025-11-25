import { supabase } from '@/lib/supabase';

/**
 * Elimina (soft delete) un tipo de proyecto personalizado de una organización.
 * Solo se pueden eliminar tipos que pertenecen a la organización (no del sistema).
 * Usa soft delete para mantener integridad referencial.
 * 
 * @param typeId - ID del tipo de proyecto a eliminar
 * @param organizationId - ID de la organización (para validación)
 * @throws {Error} Si falla la eliminación, si se intenta eliminar un tipo del sistema, o si faltan parámetros requeridos
 */
export async function deleteProjectType(typeId: string, organizationId: string) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (!typeId || !organizationId) {
    throw new Error('Missing required parameters: typeId and organizationId are required');
  }

  const { error } = await supabase
    .from('project_types')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', typeId)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false);

  if (error) {
    console.error('Error deleting project type:', error);
    throw error;
  }
}
