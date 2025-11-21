/**
 * Project Mappers
 * 
 * Functions to transform project data from Supabase to the expected format.
 */

import type { Project, ProjectData } from '../types';

/**
 * Transforma project_data de array a objeto.
 * 
 * Supabase devuelve project_data como array cuando hacemos .select() con relaciones.
 * Esta función normaliza el dato para que siempre sea un objeto o null.
 * 
 * @param rawProject - Proyecto raw de Supabase
 * @returns Proyecto con project_data normalizado
 */
export function transformProjectData(rawProject: any): Project {
  let projectData: ProjectData | null = null;
  
  // Manejar estructura anidada (legacy) o plana (vista optimizada)
  if (rawProject.project_data) {
    // Estructura anidada: proyecto viene con project_data como objeto/array
    const pd = Array.isArray(rawProject.project_data) 
      ? rawProject.project_data[0] 
      : rawProject.project_data;
    
    if (pd) {
      projectData = {
        project_type_id: pd.project_type_id,
        project_modality_id: pd.project_modality_id,
        project_image_url: pd.project_image_url,
        project_type: pd.project_type,
        project_modality: pd.modality
      };
    }
  } else if (rawProject.project_type_id || rawProject.project_modality_id || rawProject.project_image_url) {
    // Estructura plana: proyecto viene de la vista projects_view
    projectData = {
      project_type_id: rawProject.project_type_id,
      project_modality_id: rawProject.project_modality_id,
      project_image_url: rawProject.project_image_url,
      project_type: rawProject.project_type_name ? {
        id: rawProject.project_type_id,
        name: rawProject.project_type_name
      } : undefined,
      project_modality: rawProject.project_modality_name ? {
        id: rawProject.project_modality_id,
        name: rawProject.project_modality_name
      } : undefined
    };
  }
  
  // Limpiar campos planos de la vista para evitar duplicación
  const { 
    project_type_id, 
    project_modality_id, 
    project_image_url,
    project_type_name,
    project_modality_name,
    city,
    country,
    start_date,
    estimated_end,
    ...cleanProject 
  } = rawProject;
  
  return {
    ...cleanProject,
    project_data: projectData
  };
}

/**
 * Transforma un array de proyectos normalizando project_data.
 * 
 * @param rawProjects - Array de proyectos raw de Supabase
 * @returns Array de proyectos transformados
 */
export function transformProjects(rawProjects: any[]): Project[] {
  return (rawProjects || []).map(transformProjectData);
}
