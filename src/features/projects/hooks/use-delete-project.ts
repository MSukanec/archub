import { useMutation, useQueryClient } from '@tanstack/react-query';
import { softDeleteProject } from '../services/softDeleteProject';
import { QUERY_KEYS } from '../constants';

/**
 * Hook para eliminar (soft delete) un proyecto.
 * 
 * Usa useMutation de React Query para gestionar la eliminación.
 * Invalida las queries de proyectos después de eliminar.
 * 
 * @returns Mutation para eliminar proyecto
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, organizationId }: { projectId: string; organizationId: string }) => 
      softDeleteProject(projectId, organizationId),
    onSuccess: () => {
      // Invalidate all project-related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS], exact: false });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS_LITE], exact: false });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS_MAP], exact: false });
    },
  });
}
