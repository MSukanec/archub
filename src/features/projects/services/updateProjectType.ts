import { supabase } from '@/lib/supabase';
export interface UpdateProjectTypeData {
  name?: string;
}
/**
 * Actualiza un tipo de proyecto personalizado de una organización.
 * Solo se pueden actualizar tipos que pertenecen a la organización (no del sistema).
 * 
 * @param typeId - ID del tipo de proyecto a actualizar
 * @param organizationId - ID de la organización (para validación)
 * @param data - Datos a actualizar
 * @throws {Error} Si falla la actualización o si se intenta actualizar un tipo del sistema
 */
export async function updateProjectType(
  typeId: string,
  organizationId: string,
  data: UpdateProjectTypeData
) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  if (!typeId || !organizationId) {
    throw new Error('Missing required parameters: typeId and organizationId are required');
  }
  const { error } = await supabase
    .from('project_types')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', typeId)
    .eq('organization_id', organizationId);
  if (error) {
    console.error('Error updating project type:', error);
    throw error;
  }
}
