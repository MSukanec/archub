import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Wallet {
  id: string
  name: string
  description?: string
  currency_id: string
  organization_id: string
  created_at: string
}

export function useWallets(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['wallets', organizationId],
    queryFn: async () => {
      if (!organizationId) return []

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('organization_wallets')
        .select('id, organization_id, wallet_id, is_active, is_default, created_at')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      if (error) {
        console.error('Error fetching wallets:', error)
        throw error
      }

      return data || []
    },
    enabled: !!organizationId
  })
}