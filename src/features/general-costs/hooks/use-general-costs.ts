import { useQuery } from '@tanstack/react-query';
import { getGeneralCosts } from '../services/getGeneralCosts';
import { generalCostsKeys } from '@/core/query-keys';

export function useGeneralCosts(organizationId: string | null) {
  return useQuery({
    queryKey: generalCostsKeys.list(organizationId),
    queryFn: () => getGeneralCosts(organizationId!),
    enabled: !!organizationId,
    staleTime: 30000,
  });
}
