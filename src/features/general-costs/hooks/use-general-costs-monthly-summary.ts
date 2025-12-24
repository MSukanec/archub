import { useQuery } from '@tanstack/react-query';
import { getGeneralCostsMonthlySummary } from '../services/getGeneralCostsMonthlySummary';
import { generalCostsKeys } from '@/core/query-keys';

export function useGeneralCostsMonthlySummary(organizationId: string | null) {
  return useQuery({
    queryKey: generalCostsKeys.monthlySummaryList(organizationId),
    queryFn: () => getGeneralCostsMonthlySummary(organizationId!),
    enabled: !!organizationId,
    staleTime: 30000,
  });
}
