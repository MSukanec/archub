import { useQuery } from '@tanstack/react-query';
import { getOrganizationStats } from '../services';
import { ORGANIZATION_QUERY_KEYS } from '../constants';

export function useOrganizationStats(organizationId: string | undefined) {
  return useQuery({
    queryKey: ORGANIZATION_QUERY_KEYS.stats(organizationId!),
    queryFn: () => getOrganizationStats(organizationId!),
    enabled: !!organizationId,
    retry: 0,
    staleTime: Infinity,
    gcTime: 600000,
  });
}
