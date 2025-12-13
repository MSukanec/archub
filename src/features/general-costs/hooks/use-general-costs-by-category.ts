import { useQuery } from '@tanstack/react-query';
import { getGeneralCostsByCategory } from '../services/getGeneralCostsByCategory';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';

export function useGeneralCostsByCategory(organizationId: string | null) {
  return useQuery({
    queryKey: GENERAL_COSTS_QUERY_KEYS.byCategoryList(organizationId),
    queryFn: () => getGeneralCostsByCategory(organizationId!),
    enabled: !!organizationId,
  });
}
