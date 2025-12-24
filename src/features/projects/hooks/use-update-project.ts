import { useOptimisticMutation } from '@/core/save-engine';
import { updateProject } from '../services/updateProject';
import type { UpdateProjectData } from '../types';
import { QUERY_KEYS } from '../constants';

export function useUpdateProject() {
  return useOptimisticMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: UpdateProjectData }) => 
      updateProject(projectId, data),
    queryKey: [QUERY_KEYS.PROJECTS],
    optimisticUpdate: (oldData: any, variables: { projectId: string; data: UpdateProjectData }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map((p: any) => p.id === variables.projectId ? { ...p, ...variables.data } : p);
    },
    onSuccessMessage: 'Proyecto actualizado',
    onErrorMessage: 'No se pudo actualizar el proyecto',
    additionalQueryKeys: [
      [QUERY_KEYS.PROJECTS_LITE],
    ],
  });
}
