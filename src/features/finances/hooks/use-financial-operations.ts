import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { financesKeys } from '@/core/query-keys'

export interface FinancialOperation {
  id: string
  organization_id: string
  project_id: string | null
  type: 'wallet_transfer' | 'currency_exchange'
  operation_date: string
  description: string | null
  created_by: string
  created_at: string
}

export interface FinancialOperationMovement {
  id: string
  financial_operation_id: string
  organization_id: string
  project_id: string | null
  wallet_id: string
  currency_id: string
  amount: number
  direction: 'in' | 'out'
  exchange_rate: number | null
  created_by: string
  created_at: string
}

interface CreateWalletTransferParams {
  organization_id: string
  project_id?: string | null
  operation_date: string
  description?: string | null
  source_wallet_id: string
  destination_wallet_id: string
  currency_id: string
  amount: number
  created_by_user_id: string
  created_by_member_id: string
}

interface CreateCurrencyExchangeParams {
  organization_id: string
  project_id?: string | null
  operation_date: string
  description?: string | null
  wallet_id: string
  source_currency_id: string
  destination_currency_id: string
  source_amount: number
  exchange_rate: number
  created_by_user_id: string
  created_by_member_id: string
}

export function useCreateWalletTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateWalletTransferParams) => {
      const { data: operation, error: opError } = await supabase
        .from('financial_operations')
        .insert({
          organization_id: params.organization_id,
          project_id: params.project_id || null,
          type: 'wallet_transfer',
          operation_date: params.operation_date,
          description: params.description || null,
          created_by: params.created_by_user_id,
        })
        .select()
        .single()

      if (opError) throw opError

      const movements = [
        {
          financial_operation_id: operation.id,
          organization_id: params.organization_id,
          project_id: params.project_id || null,
          wallet_id: params.source_wallet_id,
          currency_id: params.currency_id,
          amount: params.amount,
          direction: 'out' as const,
          exchange_rate: 1,
          created_by: params.created_by_member_id,
        },
        {
          financial_operation_id: operation.id,
          organization_id: params.organization_id,
          project_id: params.project_id || null,
          wallet_id: params.destination_wallet_id,
          currency_id: params.currency_id,
          amount: params.amount,
          direction: 'in' as const,
          exchange_rate: 1,
          created_by: params.created_by_member_id,
        },
      ]

      const { error: movError } = await supabase
        .from('financial_operation_movements')
        .insert(movements)

      if (movError) throw movError

      return operation
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financesKeys.operationsList(variables.organization_id) })
      queryClient.invalidateQueries({ queryKey: financesKeys.unifiedMovementsList(variables.organization_id) })
      queryClient.invalidateQueries({ queryKey: financesKeys.walletsList(variables.organization_id) })
    },
  })
}

export function useCreateCurrencyExchange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateCurrencyExchangeParams) => {
      const destinationAmount = params.source_amount * params.exchange_rate

      const { data: operation, error: opError } = await supabase
        .from('financial_operations')
        .insert({
          organization_id: params.organization_id,
          project_id: params.project_id || null,
          type: 'currency_exchange',
          operation_date: params.operation_date,
          description: params.description || null,
          created_by: params.created_by_user_id,
        })
        .select()
        .single()

      if (opError) throw opError

      const movements = [
        {
          financial_operation_id: operation.id,
          organization_id: params.organization_id,
          project_id: params.project_id || null,
          wallet_id: params.wallet_id,
          currency_id: params.source_currency_id,
          amount: params.source_amount,
          direction: 'out' as const,
          exchange_rate: params.exchange_rate,
          created_by: params.created_by_member_id,
        },
        {
          financial_operation_id: operation.id,
          organization_id: params.organization_id,
          project_id: params.project_id || null,
          wallet_id: params.wallet_id,
          currency_id: params.destination_currency_id,
          amount: destinationAmount,
          direction: 'in' as const,
          exchange_rate: params.exchange_rate,
          created_by: params.created_by_member_id,
        },
      ]

      const { error: movError } = await supabase
        .from('financial_operation_movements')
        .insert(movements)

      if (movError) throw movError

      return operation
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financesKeys.operationsList(variables.organization_id) })
      queryClient.invalidateQueries({ queryKey: financesKeys.unifiedMovementsList(variables.organization_id) })
      queryClient.invalidateQueries({ queryKey: financesKeys.walletsList(variables.organization_id) })
    },
  })
}

export function useFinancialOperations(organizationId?: string) {
  return useQuery({
    queryKey: financesKeys.operationsList(organizationId),
    queryFn: async () => {
      if (!organizationId) return []

      const { data, error } = await supabase
        .from('financial_operations')
        .select(`
          *,
          movements:financial_operation_movements(
            *,
            wallet:organization_wallets(id, wallets:wallet_id(id, name)),
            currency:currencies(id, name, symbol, code)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('operation_date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!organizationId,
  })
}
