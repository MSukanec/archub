import { useQuery } from '@tanstack/react-query';
import { getProjectById } from '../services/getProjectById';
import { QUERY_KEYS } from '../constants';

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
    queryKey: [QUERY_KEYS.PROJECT, projectId],
    queryFn: () => getProjectById(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
