import { apiRequest } from '@/lib/queryClient';

/**
 * Realiza un soft delete de un proyecto mediante el endpoint Express API.
 * 
 * Usa el endpoint DELETE /api/projects/:projectId que incluye:
 * - Autenticación (ensureAuth)
 * - Validación de acceso (ensureOrganizationAccess)
 * - Rollback en caso de error
 * - Audit logging
 * 
 * No elimina el registro de la base de datos, solo lo marca como eliminado
 * y guarda la fecha de eliminación.
 * 
 * @param projectId - ID del proyecto a eliminar
 * @param organizationId - ID de la organización (para seguridad)
 * @throws {Error} Si falla la actualización o faltan parámetros
 */
export async function softDeleteProject(projectId: string, organizationId: string): Promise<void> {
  if (!projectId || !organizationId) {
    throw new Error('Missing required parameters: projectId and organizationId are required');
  }

  const response = await apiRequest('DELETE', `/api/projects/${projectId}`, {
    organizationId,
  });

  // Si HTTP 200, parseamos { success, message }
  if (response.ok) {
    const result = await response.json();
    if (!result.success) {
      throw new Error('Delete operation failed');
    }
    return;
  }
  
  // Si HTTP 4xx/5xx, parsear el error
  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to delete project');
}
