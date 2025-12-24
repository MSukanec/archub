import { useOptimisticMutation } from '@/core/save-engine';
import { softDeleteProject } from '../services/softDeleteProject';
import { QUERY_KEYS } from '../constants';

export function useDeleteProject() {
  return useOptimisticMutation({
    mutationFn: ({ projectId, organizationId }: { projectId: string; organizationId: string }) => 
      softDeleteProject(projectId, organizationId),
    queryKey: [QUERY_KEYS.PROJECTS],
    optimisticUpdate: (oldData: any, variables: { projectId: string }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((p: any) => p.id !== variables.projectId);
    },
    onSuccessMessage: 'Proyecto eliminado',
    onErrorMessage: 'No se pudo eliminar el proyecto',
    additionalQueryKeys: [
      [QUERY_KEYS.PROJECTS_LITE],
      [QUERY_KEYS.PROJECTS_MAP],
    ],
  });
}
