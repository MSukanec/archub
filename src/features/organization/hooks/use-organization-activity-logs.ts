import { useQuery } from '@tanstack/react-query';
import { getOrganizationActivityLogs } from '../services';
import { organizationKeys } from '@/core/query-keys';
export function useOrganizationActivityLogs(organizationId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.activityLogs(organizationId),
    queryFn: () => getOrganizationActivityLogs(organizationId!),
    enabled: !!organizationId,
  });
}
