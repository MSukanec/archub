import { useOptimisticMutation } from '@/core/save-engine';
import { useQueryClient } from '@tanstack/react-query';
import { createProject } from '../services/createProject';
import { projectsKeys } from '@/core/query-keys';
import type { CreateProjectData, Project } from '../types';

export function useCreateProject(organizationId: string | undefined) {
  const queryClient = useQueryClient();

  return useOptimisticMutation<Project, CreateProjectData>({
    mutationFn: (data: CreateProjectData) => createProject(data),
    queryKey: projectsKeys.list(organizationId),
    optimisticUpdate: (oldData: any, variables: CreateProjectData) => {
      const optimisticProject = {
        id: 'temp-' + Date.now(),
        ...variables,
        created_at: new Date().toISOString(),
        is_active: true,
        is_deleted: false,
      };
      if (!Array.isArray(oldData)) return [optimisticProject];
      return [...oldData, optimisticProject];
    },
    onSuccessMessage: 'Proyecto creado',
    onErrorMessage: 'No se pudo crear el proyecto',
    additionalQueryKeys: [projectsKeys.lists()],
  });
}
