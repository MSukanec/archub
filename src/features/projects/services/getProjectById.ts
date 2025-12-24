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

  // Reject temporary IDs - they're not valid UUIDs for Supabase
  if (projectId.startsWith('temp-')) {
    return null;
  }

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_data (
        project_type_id,
        project_modality_id,
        image_bucket,
        image_path,
        project_type:project_types(id, name),
        modality:project_modalities(id, name)
      )
    `)
    .eq('id', projectId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single();
  
  if (error) {
    // PGRST116 = no rows found, which is normal when project doesn't exist
    if (error.code === 'PGRST116') {
      return null;
    }
    // 22P02 = invalid input syntax for UUID (usually from invalid ID format)
    if (error.code === '22P02') {
      return null;
    }
    console.error('Error fetching project:', error);
    throw error;
  }
  
  if (!data) {
    return null;
  }
  
  return transformProjectData(data);
}
