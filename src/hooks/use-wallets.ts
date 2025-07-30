import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Wallet {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
}

// Hook to get ALL wallets (like useCurrencies)
export const useAllWallets = () => {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Wallet[];
    },
  });
};

interface OrganizationWallet {
  id: string;
  organization_id: string;
  wallet_id: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  name?: string;
  wallet_name?: string;
  wallets?: {
    id: string;
    name: string;
    created_at: string;
  };
}

export function useWallets(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-wallets', organizationId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // First get organization wallets
      const { data: orgWallets, error: orgError } = await supabase
        .from('organization_wallets')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      if (orgError) throw orgError

      if (!orgWallets || orgWallets.length === 0) {
        return []
      }

      // Get wallet details for each organization wallet
      const walletIds = orgWallets.map(ow => ow.wallet_id)
      const { data: walletDetails, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .in('id', walletIds)

      if (walletError) throw walletError

      // Combine the data
      const data = orgWallets.map(orgWallet => ({
        ...orgWallet,
        wallets: walletDetails?.find(w => w.id === orgWallet.wallet_id)
      }))

      
      return data || []
    },
    enabled: !!organizationId
  })
}