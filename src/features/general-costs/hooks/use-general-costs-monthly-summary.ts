import { useQuery } from '@tanstack/react-query';
import { getGeneralCostsMonthlySummary } from '../services/getGeneralCostsMonthlySummary';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';

export function useGeneralCostsMonthlySummary(organizationId: string | null) {
  return useQuery({
    queryKey: GENERAL_COSTS_QUERY_KEYS.monthlySummaryList(organizationId),
    queryFn: () => getGeneralCostsMonthlySummary(organizationId!),
    enabled: !!organizationId,
  });
}
