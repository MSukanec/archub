import { useOptimisticMutation } from '@/core/save-engine';
import { softDeleteProject } from '../services/softDeleteProject';
import { projectsKeys } from '@/core/query-keys';

export function useDeleteProject(organizationId: string | undefined) {
  return useOptimisticMutation({
    mutationFn: ({ projectId, organizationId }: { projectId: string; organizationId: string }) => 
      softDeleteProject(projectId, organizationId),
    queryKey: projectsKeys.list(organizationId),
    optimisticUpdate: (oldData: any, variables: { projectId: string }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((p: any) => p.id !== variables.projectId);
    },
    onSuccessMessage: 'Proyecto eliminado',
    onErrorMessage: 'No se pudo eliminar el proyecto',
    additionalQueryKeys: [],
  });
}
