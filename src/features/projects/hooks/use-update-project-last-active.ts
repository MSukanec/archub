import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProjectLastActive } from '../services/updateProjectLastActive';

/**
 * Hook to update a project's last_active_at timestamp.
 * Call this when a user selects or interacts with a project.
 * 
 * Usage:
 *   const mutation = useUpdateProjectLastActive();
 *   await mutation.mutateAsync({ projectId: 'xxx', organizationId: 'yyy' });
 */
export function useUpdateProjectLastActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, organizationId }: { projectId: string; organizationId: string }) =>
      updateProjectLastActive(projectId, organizationId),
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries to refetch updated project data
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', variables.organizationId] });
    },
  });
}
