import { useQuery } from '@tanstack/react-query';
import { getGeneralCost } from '../services/getGeneralCost';
import { generalCostsKeys } from '@/core/query-keys';

export function useGeneralCost(generalCostId: string | null) {
  return useQuery({
    queryKey: generalCostsKeys.detail(generalCostId),
    queryFn: async () => {
      if (!generalCostId) return null;
      return getGeneralCost(generalCostId);
    },
    enabled: !!generalCostId,
    staleTime: 30000,
  });
}
