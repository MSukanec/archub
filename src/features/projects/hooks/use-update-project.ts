import { useOptimisticMutation } from '@/core/save-engine';
import { updateProject } from '../services/updateProject';
import { projectsKeys } from '@/core/query-keys';
import type { UpdateProjectData } from '../types';

export function useUpdateProject(organizationId: string | undefined) {
  return useOptimisticMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: UpdateProjectData }) => 
      updateProject(projectId, data),
    queryKey: projectsKeys.list(organizationId),
    optimisticUpdate: (oldData: any, variables: { projectId: string; data: UpdateProjectData }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map((p: any) => p.id === variables.projectId ? { ...p, ...variables.data } : p);
    },
    onSuccessMessage: 'Proyecto actualizado',
    onErrorMessage: 'No se pudo actualizar el proyecto',
    additionalQueryKeys: [],
  });
}
