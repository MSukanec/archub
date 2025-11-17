import { useQuery } from '@tanstack/react-query';
import { getCurrentProject } from '../services/getCurrentProject';
import { QUERY_KEYS } from '../constants';

/**
 * Hook para obtener el proyecto actual del usuario.
 * 
 * Verifica que el proyecto almacenado en las preferencias pertenezca
 * a la organización actual.
 * 
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns React Query result con el proyecto actual
 */
export function useCurrentProject(
  projectId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: [QUERY_KEYS.CURRENT_PROJECT, projectId, organizationId],
    queryFn: () => getCurrentProject(projectId, organizationId),
    enabled: !!projectId && !!organizationId
  });
}
