import { supabase } from '@/lib/supabase';

export interface UpdateProjectModalityData {
  name?: string;
}

/**
 * Actualiza una modalidad de proyecto personalizada de una organización.
 * Solo se pueden actualizar modalidades que pertenecen a la organización (no del sistema).
 * 
 * @param modalityId - ID de la modalidad de proyecto a actualizar
 * @param organizationId - ID de la organización (para validación)
 * @param data - Datos a actualizar
 * @throws {Error} Si falla la actualización o si se intenta actualizar una modalidad del sistema
 */
export async function updateProjectModality(
  modalityId: string,
  organizationId: string,
  data: UpdateProjectModalityData
) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (!modalityId || !organizationId) {
    throw new Error('Missing required parameters: modalityId and organizationId are required');
  }

  const { error } = await supabase
    .from('project_modalities')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', modalityId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error updating project modality:', error);
    throw error;
  }
}
