import { supabase } from '@/lib/supabase';

/**
 * Realiza un soft delete de un proyecto (marca is_deleted = true).
 * 
 * No elimina el registro de la base de datos, solo lo marca como eliminado
 * y guarda la fecha de eliminación.
 * 
 * @param projectId - ID del proyecto a eliminar
 * @param organizationId - ID de la organización (para seguridad)
 * @throws {Error} Si falla la actualización o faltan parámetros
 */
export async function softDeleteProject(projectId: string, organizationId: string) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (!projectId || !organizationId) {
    throw new Error('Missing required parameters: projectId and organizationId are required');
  }

  const { error } = await supabase
    .from('projects')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error soft deleting project:', error);
    throw error;
  }
}
