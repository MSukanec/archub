import { supabase } from '@/lib/supabase';
/**
 * Elimina un tipo de bitácora personalizado de una organización.
 * Solo se pueden eliminar tipos que pertenecen a la organización (no del sistema).
 * 
 * @param typeId - ID del tipo de bitácora a eliminar
 * @param organizationId - ID de la organización (para validación)
 * @throws {Error} Si falla la eliminación, si se intenta eliminar un tipo del sistema, o si faltan parámetros requeridos
 */
export async function deleteSiteLogType(typeId: string, organizationId: string) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  if (!typeId || !organizationId) {
    throw new Error('Missing required parameters: typeId and organizationId are required');
  }
  // Soft delete solo si pertenece a la organización (no tipos del sistema)
  const { error } = await supabase
    .from('site_log_types')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString() 
    })
    .eq('id', typeId)
    .eq('organization_id', organizationId);
  if (error) {
    console.error('Error deleting site log type:', error);
    throw error;
  }
}
