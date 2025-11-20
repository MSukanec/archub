import { apiRequest } from '@/lib/queryClient';
import type { UpdateProjectData } from '../types';

/**
 * Actualiza un proyecto existente y sus datos relacionados.
 * 
 * Usa el endpoint de la API para actualizar el proyecto y automáticamente
 * actualiza el registro en project_data si se modifican tipo o modalidad.
 * 
 * @param projectId - ID del proyecto a actualizar
 * @param data - Datos a actualizar
 * @returns Proyecto actualizado
 * @throws {Error} Si falla la actualización o faltan parámetros requeridos
 */
export async function updateProject(projectId: string, data: UpdateProjectData) {
  if (!projectId || !data.organization_id) {
    throw new Error('Missing required parameters: projectId and organization_id are required');
  }

  const response = await apiRequest('PATCH', `/api/projects/${projectId}`, {
    name: data.name,
    status: data.status,
    color: data.color,
    use_custom_color: data.use_custom_color,
    custom_color_h: data.custom_color_h,
    custom_color_hex: data.custom_color_hex,
    project_type_id: data.project_type_id,
    modality_id: data.modality_id,
    organization_id: data.organization_id,
  });

  const updatedProject = await response.json();
  return updatedProject;
}
