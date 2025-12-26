import { useQuery } from '@tanstack/react-query';
import { getOrganizationStats } from '../services';
import { organizationKeys } from '@/core/query-keys';

export function useOrganizationStats(organizationId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.stats(organizationId),
    queryFn: () => getOrganizationStats(organizationId!),
    enabled: !!organizationId,
    retry: 0,
    staleTime: Infinity,
    gcTime: 600000,
  });
}
