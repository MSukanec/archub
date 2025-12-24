import { useQuery } from '@tanstack/react-query';
import { getProjectById } from '../services/getProjectById';
import { projectsKeys } from '@/core/query-keys';

/**
 * Hook para obtener un proyecto específico por ID.
 * 
 * Usa React Query para cachear y gestionar el estado de la petición.
 * Los datos incluyen project_data con tipos y modalidades.
 * 
 * @param projectId - ID del proyecto
 * @returns Query con el proyecto o null
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectsKeys.detail(projectId),
    queryFn: () => getProjectById(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
