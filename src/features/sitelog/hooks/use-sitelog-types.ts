import { useQuery } from '@tanstack/react-query';
import { getSiteLogTypes } from '../services/getSiteLogTypes';

export function useSiteLogTypes(organizationId?: string) {
  return useQuery({
    queryKey: ['sitelog-types', organizationId],
    queryFn: () => getSiteLogTypes(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
