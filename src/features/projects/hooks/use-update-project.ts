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
      // ✅ ACTUALIZAR CACHE DIRECTAMENTE (NO invalidar para evitar flicker)
      // Actualizar la lista de proyectos con los datos del servidor
      queryClient.setQueryData(
        [QUERY_KEYS.PROJECTS],
        (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((p: any) => p.id === updatedProject.id ? updatedProject : p);
        }
      );

      // Actualizar el proyecto individual si existe en cache
      queryClient.setQueryData(
        [QUERY_KEYS.PROJECT, updatedProject.id],
        updatedProject
      );

      // Actualizar project-data si existe en cache
      queryClient.setQueryData(
        [QUERY_KEYS.PROJECT_DATA, updatedProject.id],
        updatedProject.project_data
      );
    },
  });
}
