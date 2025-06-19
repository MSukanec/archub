import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Currency {
  id: string
  name: string
  code: string
  symbol?: string
  created_at: string
}

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('currencies')
        .select('id, name, code, symbol, created_at')
        .order('code')

      if (error) {
        console.error('Error fetching currencies:', error)
        throw error
      }

      return data || []
    }
  })
}