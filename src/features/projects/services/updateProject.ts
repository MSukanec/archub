import { apiRequest } from '@/lib/queryClient';
import type { Project, UpdateProjectData } from '../types';
/**
 * Actualiza un proyecto existente mediante el endpoint Express API.
 * 
 * Usa el endpoint PATCH /api/projects/:id que incluye:
 * - Autenticación (ensureAuth)
 * - Validación de acceso (ensureOrganizationAccess)
 * - Rollback en caso de error
 * - Audit logging
 * 
 * @param projectId - ID del proyecto a actualizar
 * @param data - Datos a actualizar (incluye organization_id)
 * @returns Proyecto actualizado
 * @throws {Error} Si falla la actualización o faltan parámetros requeridos
 */
export async function updateProject(projectId: string, data: UpdateProjectData): Promise<Project> {
  if (!projectId || !data.organization_id) {
    throw new Error('Project ID and Organization ID required');
  }
  const response = await apiRequest('PATCH', `/api/projects/${projectId}`, {
    organization_id: data.organization_id,
    name: data.name,
    status: data.status,
    color: data.color,
    use_custom_color: data.use_custom_color,
    custom_color_h: data.custom_color_h,
    custom_color_hex: data.custom_color_hex,
    project_type_id: data.project_type_id,
    project_modality_id: data.project_modality_id,
    currency_id: data.currency_id,
  });
  // Si HTTP 200, el JSON ES el proyecto directamente
  if (response.ok) {
    const project = await response.json();
    return project;
  }
  
  // Si HTTP 4xx/5xx, parsear el error
  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to update project');
}
