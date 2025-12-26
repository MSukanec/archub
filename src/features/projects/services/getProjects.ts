import { supabase } from '@/lib/supabase';
import type { Project } from '../types';
import { transformProjects } from '../mappers/projectMapper';

/**
 * Obtiene todos los proyectos de una organización con sus relaciones.
 * 
 * Incluye:
 * - Datos del proyecto (project_data) - incluyendo image_bucket, image_path, is_public
 * - Tipo de proyecto (project_types)
 * - Modalidad (project_modalities)
 * 
 * CRÍTICO: Solo devuelve proyectos que cumplen AMBAS condiciones:
 * - is_active = true (Estado del proyecto)
 * - is_deleted = false (Soft delete)
 * 
 * DEBE ser consistente con getProjectById para evitar inconsistencias en el cache.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de proyectos con todas sus relaciones, o array vacío
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getProjects(organizationId: string): Promise<Project[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  // Usar la vista projects_view que ya tiene TODA la información:
  // - project_type_id, project_type_name
  // - project_modality_id, project_modality_name
  // - image_bucket, image_path, is_public
  const { data, error } = await supabase
    .from('projects_view')
    .select('*')
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
