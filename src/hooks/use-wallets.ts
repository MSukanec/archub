import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Wallet {
  id: string;
  name: string;
  created_at: string;
}

export function useWallets(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['wallets', organizationId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Error fetching wallets:', error)
        throw error
      }
      
      return data as Wallet[]
    },
    enabled: !!organizationId
  })
}