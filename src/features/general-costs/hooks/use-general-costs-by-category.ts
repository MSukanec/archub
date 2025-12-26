import { useQuery } from '@tanstack/react-query';
import { getGeneralCostsByCategory } from '../services/getGeneralCostsByCategory';
import { generalCostsKeys } from '@/core/query-keys';
export function useGeneralCostsByCategory(organizationId: string | null) {
  return useQuery({
    queryKey: generalCostsKeys.byCategoryList(organizationId),
    queryFn: async () => {
      if (!organizationId) return [];
      return getGeneralCostsByCategory(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 30000,
  });
}
