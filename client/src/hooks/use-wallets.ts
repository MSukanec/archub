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
        .from('wallets')
        .select('id, name, description, currency_id, organization_id, created_at')
        .eq('organization_id', organizationId)
        .order('name')

      if (error) {
        console.error('Error fetching wallets:', error)
        throw error
      }

      return data || []
    },
    enabled: !!organizationId
  })
}