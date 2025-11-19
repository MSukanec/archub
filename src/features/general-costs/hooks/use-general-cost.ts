import { useQuery } from '@tanstack/react-query';
import { getGeneralCost } from '../services/getGeneralCost';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';

export function useGeneralCost(generalCostId: string | null) {
  return useQuery({
    queryKey: GENERAL_COSTS_QUERY_KEYS.detail(generalCostId),
    queryFn: () => getGeneralCost(generalCostId!),
    enabled: !!generalCostId,
  });
}
