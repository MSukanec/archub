import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CurrencyLite {
  id: string
  name: string
  symbol: string
  code: string
}

export const useCurrenciesLite = () => {
  return useQuery<CurrencyLite[]>({
    queryKey: ['currencies-lite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('id, name, symbol, code')
        .order('name')
      
      if (error) throw error
      return data || []
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    placeholderData: (prev) => prev ?? [],
  })
}