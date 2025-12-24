import { useQuery } from '@tanstack/react-query';
import { getGeneralCostPayment } from '../services/getGeneralCostPayment';
import { generalCostsKeys } from '@/core/query-keys';

export function useGeneralCostPayment(id: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: generalCostsKeys.payment(id),
    queryFn: () => getGeneralCostPayment(id!, organizationId!),
    enabled: !!id && !!organizationId,
    staleTime: 30000,
  });
}
