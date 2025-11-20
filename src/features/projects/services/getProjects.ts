import { supabase } from '@/lib/supabase';
import type { Project } from '../types';
import { transformProjects } from '../mappers/projectMapper';

/**
 * Obtiene todos los proyectos de una organización con sus relaciones.
 * 
 * Incluye:
 * - Datos del proyecto (project_data)
 * - Tipo de proyecto (project_types)
 * - Modalidad (project_modalities)
 * 
 * Solo devuelve proyectos activos y no eliminados.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de proyectos con todas sus relaciones, o array vacío
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getProjects(organizationId: string): Promise<Project[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_data (
        project_type_id,
        modality_id,
        project_image_url,
        project_type:project_types(id, name),
        modality:project_modalities(id, name)
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  
  return transformProjects(data || []);
}
