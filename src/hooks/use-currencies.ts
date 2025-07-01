import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Currency {
  id: string
  name: string
  symbol: string
  code: string
}

export interface OrganizationCurrency {
  currency: Currency
}

export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data as Currency[]
    },
  })
}

export const useOrganizationCurrencies = (organizationId?: string) => {
  return useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      
      const { data, error } = await supabase
        .from('organization_currencies')
        .select(`
          currency:currencies(*)
        `)
        .eq('organization_id', organizationId)
      
      if (error) throw error
      return data as OrganizationCurrency[]
    },
    enabled: !!organizationId,
  })
}

export const useOrganizationDefaultCurrency = (organizationId?: string) => {
  return useQuery({
    queryKey: ['organization-default-currency', organizationId],
    queryFn: async () => {
      if (!organizationId) return null
      
      const { data, error } = await supabase
        .from('organization_preferences')
        .select(`
          default_currency:currencies(*)
        `)
        .eq('organization_id', organizationId)
        .single()
      
      if (error) throw error
      return data?.default_currency as Currency | null
    },
    enabled: !!organizationId,
  })
}