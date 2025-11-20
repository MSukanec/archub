import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProject } from '../services/createProject';
import type { CreateProjectData } from '../types';
import { QUERY_KEYS } from '../constants';

/**
 * Hook para crear un nuevo proyecto.
 * 
 * Usa useMutation de React Query para gestionar la creación.
 * Invalida las queries de proyectos después de crear.
 * 
 * @returns Mutation para crear proyecto
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => createProject(data),
    onSuccess: (_, variables) => {
      // Invalidate all project-related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS], exact: false });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS_LITE], exact: false });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS_MAP], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-data'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['current-user'], exact: false });
    },
  });
}
