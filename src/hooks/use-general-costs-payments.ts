import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

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
  file_url: string | null
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
}

export function useGeneralCostsPayments(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['general-costs-payments', organizationId],
    queryFn: async () => {
      if (!organizationId) return []

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('general_costs_payments')
        .select(`
          *,
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
          ),
          creator:organization_members!general_costs_payments_created_by_fkey(
            id,
            users(
              id,
              full_name,
              email,
              avatar_url
            )
          )
        `)
        .eq('organization_id', organizationId)
        .order('payment_date', { ascending: false })

      if (error) {
        console.error('Error fetching general costs payments:', error)
        throw error
      }

      // Transform creator data
      const transformedData = (data || []).map(payment => ({
        ...payment,
        creator: payment.creator?.users || null
      }))

      return transformedData as GeneralCostPayment[]
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
        .delete()
        .eq('id', paymentId)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error deleting general cost payment:', error)
        throw error
      }

      return { paymentId }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['general-costs-payments', variables.organizationId] })
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
