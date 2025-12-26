import { supabase } from '@/lib/supabase';
export interface UpdateSiteLogTypeData {
  name?: string;
  description?: string | null;
}
/**
 * Actualiza un tipo de bitácora personalizado de una organización.
 * Solo se pueden actualizar tipos que pertenecen a la organización (no del sistema).
 * 
 * @param typeId - ID del tipo de bitácora a actualizar
 * @param organizationId - ID de la organización (para validación)
 * @param data - Datos a actualizar
 * @returns El tipo de bitácora actualizado
 * @throws {Error} Si falla la actualización, si se intenta actualizar un tipo del sistema, o si faltan parámetros requeridos
 */
export async function updateSiteLogType(
  typeId: string,
  organizationId: string,
  data: UpdateSiteLogTypeData
) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  if (!typeId || !organizationId) {
    throw new Error('Missing required parameters: typeId and organizationId are required');
  }
  // Actualizar solo si pertenece a la organización (no tipos del sistema)
  const { data: updatedType, error } = await supabase
    .from('site_log_types')
    .update(data)
    .eq('id', typeId)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) {
    console.error('Error updating site log type:', error);
    throw error;
  }
  return updatedType;
}
