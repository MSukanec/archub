import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Currency {
  id: string
  name: string
  symbol: string
  code: string
}

export interface OrganizationCurrency {
  id: string
  organization_id: string
  currency_id: string
  is_default: boolean
  is_active: boolean
  currency: Currency
}

export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      console.log('🔧 Fetching all currencies...')
      try {
        const { data, error } = await supabase
          .from('currencies')
          .select('*')
          .order('name')
        
        if (error) {
          console.error('🔧 Error fetching currencies:', error)
          throw error
        }
        console.log('🔧 Currencies fetched:', data?.length || 0, 'items', data)
        return data as Currency[]
      } catch (err) {
        console.error('🔧 Exception fetching currencies:', err)
        throw err
      }
    },
  })
}

export const useOrganizationCurrencies = (organizationId?: string) => {
  return useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      
      console.log('🔧 Fetching organization currencies for:', organizationId)
      const { data, error } = await supabase
        .from('organization_currencies')
        .select(`
          id,
          organization_id,
          currency_id,
          is_default,
          is_active,
          currency:currencies(*)
        `)
        .eq('organization_id', organizationId)
        .order('is_default', { ascending: false })
      
      if (error) {
        console.error('🔧 Error fetching organization currencies:', error)
        throw error
      }
      console.log('🔧 Organization currencies fetched:', data?.length || 0, 'items')
      return (data || []) as unknown as OrganizationCurrency[]
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
      return (data?.default_currency || null) as unknown as Currency | null
    },
    enabled: !!organizationId,
  })
}