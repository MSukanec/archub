import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useGeneralCostPaymentMedia(paymentId: string | undefined) {
  return useQuery({
    queryKey: ['general-cost-payment-media', paymentId],
    queryFn: async () => {
      if (!paymentId || !supabase) return []
      
      // NOTE: Currently media_links doesn't have general_cost_payment_id column
      // TODO: Enable this query once column is added to database
      console.log('[DEBUG] Skipping media files fetch - general_cost_payment_id column not in database')
      return []
    },
    enabled: !!paymentId
  })
}
