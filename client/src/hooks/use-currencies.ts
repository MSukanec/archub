import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface OrganizationCurrency {
  id: string
  organization_id: string
  currency_id: string
  is_active: boolean
  is_default: boolean
  created_at: string
}

export function useCurrencies(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('organization_currencies')
        .select('id, organization_id, currency_id, is_active, is_default, created_at')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      if (error) {
        console.error('Error fetching organization currencies:', error)
        throw error
      }

      return data || []
    },
    enabled: !!organizationId
  })
}