import { useQuery } from '@tanstack/react-query';
import { getOrganizationActivity } from '../services';
import { ORGANIZATION_QUERY_KEYS } from '../constants';

export function useOrganizationActivity(organizationId: string | undefined) {
  return useQuery({
    queryKey: ORGANIZATION_QUERY_KEYS.activity(organizationId!),
    queryFn: () => getOrganizationActivity(organizationId!),
    enabled: !!organizationId,
    retry: 0,
    staleTime: Infinity,
    gcTime: 600000,
  });
}
