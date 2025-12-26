import { useQuery } from '@tanstack/react-query';
import { getProjectPersonnel } from '../services/getProjectPersonnel';

export function useProjectPersonnel(projectId?: string, organizationId?: string) {
  return useQuery({
    queryKey: ['project-personnel', projectId, organizationId],
    queryFn: () => getProjectPersonnel(projectId!, organizationId!),
    enabled: !!projectId && !!organizationId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
