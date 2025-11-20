import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProject } from '../services/updateProject';
import type { UpdateProjectData } from '../types';
import { QUERY_KEYS } from '../constants';

/**
 * Hook para actualizar un proyecto existente.
 * 
 * Usa useMutation de React Query para gestionar la actualización.
 * Invalida las queries de proyectos después de actualizar.
 * 
 * @returns Mutation para actualizar proyecto
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: UpdateProjectData }) => 
      updateProject(projectId, data),
    onSuccess: (updatedProject) => {
      // Invalidate all project-related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS], exact: false });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS_LITE], exact: false });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS_MAP], exact: false });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECT, updatedProject.id], exact: false });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECT_DATA, updatedProject.id], exact: false });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECT_COLOR, updatedProject.id], exact: false });
    },
  });
}
