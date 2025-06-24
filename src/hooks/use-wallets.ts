import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Wallet {
  id: string;
  name: string;
  organization_id: string;
  is_active: boolean;
  created_at: string;
}

export function useWallets(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['wallets', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching wallets:', error);
        throw error;
      }
      
      return data as Wallet[];
    },
    enabled: !!organizationId,
  });
}