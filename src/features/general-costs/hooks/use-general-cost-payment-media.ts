import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getGeneralCostPaymentFiles } from '../services/getGeneralCostPaymentFiles';
import { generalCostsKeys } from '@/core/query-keys';
export function useGeneralCostPaymentMedia(paymentId: string | undefined) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  return useQuery({
    queryKey: generalCostsKeys.paymentMedia(paymentId, organizationId),
    queryFn: async () => {
      if (!paymentId || !organizationId) return [];
      return await getGeneralCostPaymentFiles(paymentId, organizationId);
    },
    enabled: !!paymentId && !!organizationId,
    staleTime: 30000,
  });
}
