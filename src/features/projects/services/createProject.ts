import { apiRequest } from '@/lib/queryClient';
import type { CreateProjectData } from '../types';

/**
 * Crea un nuevo proyecto con sus datos relacionados.
 * 
 * Usa el endpoint de la API para crear el proyecto y automáticamente
 * crea el registro en project_data si se proporcionan tipo o modalidad.
 * 
 * @param data - Datos del proyecto a crear
 * @returns Proyecto creado con su ID
 * @throws {Error} Si falla la creación o faltan parámetros requeridos
 */
export async function createProject(data: CreateProjectData) {
  if (!data.organization_id || !data.name || !data.created_by) {
    throw new Error('Missing required parameters: organization_id, name, and created_by are required');
  }

  const response = await apiRequest('POST', '/api/projects', {
    organization_id: data.organization_id,
    name: data.name,
    status: data.status,
    created_by: data.created_by,
    color: data.color || "#84cc16",
    use_custom_color: data.use_custom_color || false,
    custom_color_h: data.custom_color_h || null,
    custom_color_hex: data.custom_color_hex || null,
    project_type_id: data.project_type_id || null,
    modality_id: data.modality_id || null,
  });

  const newProject = await response.json();
  return newProject;
}
