import { useQuery } from '@tanstack/react-query';
import { getGeneralCostPayment } from '../services/getGeneralCostPayment';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';

export function useGeneralCostPayment(id: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: GENERAL_COSTS_QUERY_KEYS.payment(id || null),
    queryFn: () => getGeneralCostPayment(id!, organizationId!),
    enabled: !!id && !!organizationId,
  });
}
