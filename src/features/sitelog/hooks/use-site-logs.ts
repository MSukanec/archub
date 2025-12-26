import { useQuery } from '@tanstack/react-query';
import { getSiteLogs } from '../services/getSiteLogs';

export function useSiteLogs(
  projectId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: ['site-logs', projectId, organizationId],
    queryFn: () => getSiteLogs(projectId, organizationId!),
    enabled: !!organizationId,
    staleTime: 0
  });
}
