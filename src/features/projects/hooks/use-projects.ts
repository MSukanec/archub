import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../services/getProjects';
import { projectsKeys } from '@/core/query-keys';

/**
 * Hook para obtener todos los proyectos de una organización.
 * 
 * FUENTE ÚNICA DE VERDAD para proyectos.
 * Usa React Query para cachear y gestionar el estado de la petición.
 * Los datos incluyen project_data con tipos y modalidades.
 * 
 * @param organizationId - ID de la organización
 * @returns Query con array de proyectos
 */
export function useProjects(organizationId: string | undefined) {
  return useQuery({
    queryKey: projectsKeys.list(organizationId),
    queryFn: () => getProjects(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
