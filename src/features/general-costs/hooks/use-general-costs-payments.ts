import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { GENERAL_COSTS_QUERY_KEYS } from '@/features/general-costs/constants'

export interface GeneralCostPayment {
  id: string
  organization_id: string
  amount: number
  currency_id: string
  exchange_rate: number
  payment_date: string
  notes: string | null
  reference: string | null
  created_at: string
  updated_at: string
  wallet_id: string | null
  general_cost_id: string | null
  status: 'confirmed' | 'pending' | 'rejected' | 'void'
  created_by: string | null
  attachments_count?: number
  general_cost?: {
    id: string
    name: string
    description: string | null
  } | null
  currency?: {
    id: string
    code: string
    symbol: string
    name: string
  } | null
  wallet?: {
    id: string
    organization_id: string
    wallet_id: string
    is_active: boolean
    is_default: boolean
    wallets: {
      id: string
      name: string
      is_active: boolean
    } | null
  } | null
  creator?: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
  media_links?: Array<{
    id: string
    media_file_id: string
    media_files: {
      id: string
      file_name: string
      file_type: string
      bucket: string
      file_path: string
    }
  }>
}

export function useGeneralCostsPayments(organizationId: string | undefined) {
  return useQuery({
    queryKey: GENERAL_COSTS_QUERY_KEYS.paymentsList(organizationId || null),
    queryFn: async () => {
      if (!organizationId) return []

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('general_costs_payments')
        .select(`
          id,
          organization_id,
          amount,
          currency_id,
          exchange_rate,
          payment_date,
          notes,
          reference,
          created_at,
          updated_at,
          wallet_id,
          general_cost_id,
          status,
          created_by,
          general_cost:general_costs(
            id,
            name,
            description
          ),
          currency:currencies(
            id,
            code,
            symbol,
            name
          ),
          wallet:organization_wallets(
            id,
            organization_id,
            wallet_id,
            is_active,
            is_default,
            wallets:wallet_id(
              id,
              name,
              is_active
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('payment_date', { ascending: false })

      if (error) {
        console.error('Error fetching general costs payments:', error)
        throw error
      }

      // NOTE: media_links now has general_cost_payment_id column
      // Attachments are loaded dynamically in ViewModal using useGeneralCostPaymentMedia hook
      // getGeneralCostPaymentFiles handles signed URL generation for private-assets
      return (data || []).map(payment => {
        // Supabase returns single relations as arrays, convert to single objects
        const walletData = Array.isArray(payment.wallet) ? payment.wallet[0] : payment.wallet
        return {
          ...payment,
          general_cost: Array.isArray(payment.general_cost) ? payment.general_cost[0] : payment.general_cost,
          currency: Array.isArray(payment.currency) ? payment.currency[0] : payment.currency,
          wallet: walletData ? {
            ...walletData,
            wallets: Array.isArray(walletData.wallets) ? walletData.wallets[0] : walletData.wallets
          } : null,
          attachments_count: 0 // TODO: Calculate from media_links count if needed for list view
        }
      }) as unknown as GeneralCostPayment[]
    },
    enabled: !!organizationId,
  })
}

export function useDeleteGeneralCostPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ paymentId, organizationId }: { paymentId: string; organizationId: string }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase
        .from('general_costs_payments')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error deleting general cost payment:', error)
        throw error
      }

      return { paymentId }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.payments() })
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.lists() })
      toast({
        title: "Pago eliminado",
        description: "El pago se eliminó correctamente",
      })
    },
    onError: (error) => {
      console.error('Error deleting general cost payment:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el pago",
        variant: "destructive",
      })
    },
  })
}
