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

      // First get organization currencies
      const { data: orgCurrencies, error: orgError } = await supabase
        .from('organization_currencies')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      if (orgError) throw orgError

      if (!orgCurrencies || orgCurrencies.length === 0) {
        return []
      }

      // Get currency details for each organization currency
      const currencyIds = orgCurrencies.map(oc => oc.currency_id)
      const { data: currencyDetails, error: currencyError } = await supabase
        .from('currencies')
        .select('*')
        .in('id', currencyIds)

      if (currencyError) throw currencyError

      // Combine the data
      const data = orgCurrencies.map(orgCurrency => ({
        ...orgCurrency,
        currencies: currencyDetails?.find(c => c.id === orgCurrency.currency_id)
      }))

      console.log('Currency hook debug:', { orgCurrencies, currencyDetails, data })
      
      return data || []
    },
    enabled: !!organizationId
  })
}