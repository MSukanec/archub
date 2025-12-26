import { useQuery } from '@tanstack/react-query';
import { getClientDashboardData } from '../services/dashboard';
import { CLIENT_QUERY_KEYS } from '../constants';

export function useClientDashboard(
  projectId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.dashboard(projectId),
    queryFn: () => getClientDashboardData(projectId!, organizationId!),
    enabled: !!projectId && !!organizationId,
  });
}
