import { supabase } from '@/lib/supabase';

export interface UpdateSiteLogTypeData {
  name?: string;
  code?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
}

/**
 * Actualiza un tipo de bitácora personalizado de una organización.
 * Solo se pueden actualizar tipos que pertenecen a la organización (no del sistema).
 * 
 * @param typeId - ID del tipo de bitácora a actualizar
 * @param organizationId - ID de la organización (para validación)
 * @param data - Datos a actualizar
 * @throws {Error} Si falla la actualización o si se intenta actualizar un tipo del sistema
 */
export async function updateSiteLogType(
  typeId: string,
  organizationId: string,
  data: UpdateSiteLogTypeData
) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // Actualizar solo si pertenece a la organización
  const { error } = await supabase
    .from('site_log_types')
    .update(data)
    .eq('id', typeId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error updating site log type:', error);
    throw error;
  }
}
