import { useOptimisticMutation } from '@/core/save-engine';
import { projectsKeys } from '@/core/query-keys';
import { updateProjectLastActive } from '../services/updateProjectLastActive';
export function useUpdateProjectLastActive() {
  return useOptimisticMutation({
    mutationFn: ({ projectId, organizationId }: { projectId: string; organizationId: string }) =>
      updateProjectLastActive(projectId, organizationId),
    queryKey: projectsKeys.lists(),
    optimisticUpdate: (oldData: any, variables: { projectId: string }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map((p: any) => 
        p.id === variables.projectId 
          ? { ...p, last_active_at: new Date().toISOString() } 
          : p
      );
    },
    onSuccessMessage: undefined,
    onErrorMessage: 'No se pudo actualizar la actividad del proyecto',
    invalidateOnSuccess: false,
    additionalQueryKeys: [],
  });
}
