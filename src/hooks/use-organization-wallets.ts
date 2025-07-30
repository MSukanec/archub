import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface OrganizationWallet {
  id: string;
  organization_id: string;
  wallet_id: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
  wallets: {
    id: string;
    name: string;
    created_at: string;
    is_active: boolean;
  };
}

export function useOrganizationWallets(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-wallets', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      console.log('Fetching organization wallets for:', organizationId);
      
      const { data, error } = await supabase
        .from('organization_wallets')
        .select(`
          *,
          wallets:wallet_id (
            id,
            name,
            created_at,
            is_active
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching organization wallets:', error);
        throw error;
      }
      
      console.log('Organization wallets fetched:', data);
      return data as OrganizationWallet[];
    },
    enabled: !!organizationId,
  });
}