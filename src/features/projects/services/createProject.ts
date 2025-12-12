import { apiRequest } from '@/lib/queryClient';
import type { Project, CreateProjectData } from '../types';

/**
 * Crea un nuevo proyecto mediante el endpoint Express API.
 * 
 * Usa el endpoint POST /api/projects que incluye:
 * - Autenticación (ensureAuth)
 * - Validación de acceso (ensureOrganizationAccess)
 * - Rollback en caso de error
 * - Audit logging
 * 
 * @param data - Datos del proyecto a crear (incluye organization_id)
 * @returns Proyecto creado con su ID
 * @throws {Error} Si falla la creación o faltan parámetros requeridos
 */
export async function createProject(data: CreateProjectData): Promise<Project> {
  if (!data.organization_id) {
    throw new Error('Organization ID required');
  }

  if (!data.currency_id) {
    throw new Error('Currency ID required');
  }

  const response = await apiRequest('POST', '/api/projects', {
    organization_id: data.organization_id,
    name: data.name,
    status: data.status || 'active',
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
  throw new Error(errorData.error || 'Failed to create project');
}
