import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getGeneralCostPaymentFiles } from '../services/getGeneralCostPaymentFiles'

export function useGeneralCostPaymentMedia(paymentId: string | undefined) {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id

  return useQuery({
    queryKey: ['general-cost-payment-media', paymentId, organizationId],
    queryFn: async () => {
      if (!paymentId || !organizationId) return []
      
      return await getGeneralCostPaymentFiles(paymentId, organizationId)
    },
    enabled: !!paymentId && !!organizationId
  })
}
