import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../services/getProjects';
import { QUERY_KEYS } from '../constants';

/**
 * Hook para obtener todos los proyectos de una organización.
 * 
 * Usa React Query para cachear y gestionar el estado de la petición.
 * Los datos incluyen project_data con tipos y modalidades.
 * 
 * @param organizationId - ID de la organización
 * @returns Query con array de proyectos
 */
export function useProjects(organizationId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROJECTS, organizationId],
    queryFn: () => getProjects(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
