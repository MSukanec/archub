import { supabase } from '@/lib/supabase';
import type { Project } from '../types';
import { transformProjectData } from '../mappers/projectMapper';

/**
 * Obtiene un proyecto específico por su ID con todas sus relaciones.
 * 
 * Incluye:
 * - Datos del proyecto (project_data)
 * - Tipo de proyecto (project_types)
 * - Modalidad (project_modalities)
 * 
 * Solo devuelve el proyecto si está activo y no eliminado.
 * 
 * @param projectId - ID del proyecto a obtener
 * @returns Proyecto con todas sus relaciones, o null si no existe
 * @throws {Error} Si falla la query de Supabase
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  if (!supabase || !projectId) {
    return null;
  }

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_data (
        project_type_id,
        project_modality_id,
        project_image_url,
        project_type:project_types(id, name),
        modality:project_modalities(id, name)
      )
    `)
    .eq('id', projectId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single();
  
  if (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
  
  if (!data) {
    return null;
  }
  
  return transformProjectData(data);
}
