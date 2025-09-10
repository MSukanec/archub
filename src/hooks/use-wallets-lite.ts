import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface WalletLite {
  id: string
  name: string
  is_default: boolean
}

export const useWalletsLite = () => {
  return useQuery<WalletLite[]>({
    queryKey: ['wallets-lite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, name, is_default')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data || []
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    placeholderData: (prev) => prev ?? [],
  })
}