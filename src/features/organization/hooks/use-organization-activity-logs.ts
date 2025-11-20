import { useQuery } from '@tanstack/react-query';
import { getOrganizationActivityLogs } from '../services';
import { ORGANIZATION_QUERY_KEYS } from '../constants';

export function useOrganizationActivityLogs(organizationId: string | undefined) {
  return useQuery({
    queryKey: ORGANIZATION_QUERY_KEYS.activityLogs(organizationId!),
    queryFn: () => getOrganizationActivityLogs(organizationId!),
    enabled: !!organizationId,
  });
}
