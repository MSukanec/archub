import { supabase } from '@/lib/supabase';

/**
 * Reemplaza un tipo de bitácora con otro, actualizando todas las referencias.
 * 
 * PASO 1: Actualiza todos los site_logs que usaban el tipo antiguo para usar el nuevo
 * PASO 2: Elimina (soft delete) el tipo antiguo
 * 
 * @param oldTypeId - ID del tipo de bitácora a eliminar
 * @param newTypeId - ID del tipo de bitácora para reemplazar
 * @param organizationId - ID de la organización (para validación)
 * @throws {Error} Si falla la operación
 */
export async function replaceSiteLogType(
  oldTypeId: string,
  newTypeId: string,
  organizationId: string
) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (!oldTypeId || !newTypeId || !organizationId) {
    throw new Error('Missing required parameters: oldTypeId, newTypeId, and organizationId are required');
  }

  // PASO 1: Actualizar TODAS las referencias del tipo antiguo al nuevo
  const { error: updateError } = await supabase
    .from('site_logs')
    .update({ entry_type_id: newTypeId })
    .eq('entry_type_id', oldTypeId);

  if (updateError) {
    console.error('Error updating site log entries:', updateError);
    throw updateError;
  }

  // PASO 2: Eliminar el tipo antiguo (soft delete)
  const { error: deleteError } = await supabase
    .from('site_log_types')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', oldTypeId)
    .eq('organization_id', organizationId);

  if (deleteError) {
    console.error('Error deleting site log type:', deleteError);
    throw deleteError;
  }

  return { oldTypeId, newTypeId };
}
