import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface OrganizationCurrency {
  id: string
  organization_id: string
  currency_id: string
  is_active: boolean
  is_default: boolean
  created_at: string
  currencies: {
    id: string
    name: string
    code: string
    symbol: string
    country: string
    is_default: boolean
    created_at: string
  }
}

export function useCurrencies(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      console.log('Fetching currencies for organization:', organizationId)

      const { data, error } = await supabase
        .from('organization_currencies')
        .select(`
          *,
          currencies:currency_id (
            id,
            name,
            code,
            symbol,
            country,
            is_default,
            created_at
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching currencies:', error)
        throw error
      }

      console.log('Currencies fetched:', data)
      console.log('First currency structure:', data?.[0])
      
      return data as OrganizationCurrency[] || []
    },
    enabled: !!organizationId
  })
}