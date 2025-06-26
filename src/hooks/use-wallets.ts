import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

      const { data, error } = await supabase
        .from('organization_wallets')
        .select(`
          id,
          organization_id,
          wallet_id,
          is_active,
          is_default,
          created_at,
          wallets (
            id,
            name,
            created_at
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
      
      if (error) {
        console.error('Error fetching organization wallets:', error)
        throw error
      }
      
      // Transform data to include wallet name at top level for easier access
      const transformedData = data?.map(item => ({
        ...item,
        name: item.wallets?.name || 'Billetera sin nombre',
        wallet_name: item.wallets?.name || 'Billetera sin nombre'
      })) || []

      console.log('Transformed wallets data:', transformedData)
      return transformedData as OrganizationWallet[]
    },
    enabled: !!organizationId
  })
}