import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Movement {
  id: string
  description: string
  amount: number
  created_at: string
  created_by: string
  organization_id: string
  project_id: string
  type_id: string
  category_id: string
  currency_id: string
  wallet_id: string
  movement_data?: {
    type?: {
      id: string
      name: string
    }
    category?: {
      id: string
      name: string
    }
    currency?: {
      id: string
      name: string
      code: string
    }
    wallet?: {
      id: string
      name: string
    }
  }
  creator?: {
    id: string
    full_name?: string
    email: string
    avatar_url?: string
  }
}

export function useMovements(organizationId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: ['movements', organizationId, projectId],
    queryFn: async () => {
      if (!organizationId) return []

      console.log('Fetching movements for organization:', organizationId, 'project:', projectId)

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // First, get basic movements data
      let query = supabase
        .from('movements')
        .select(`
          id,
          description,
          amount,
          created_at,
          created_by,
          organization_id,
          project_id,
          type_id,
          category_id,
          currency_id,
          wallet_id
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      // If project is specified, filter by project
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching movements:', error)
        return []
      }

      if (!data || data.length === 0) {
        console.log('No movements found for organization:', organizationId)
        return []
      }

      console.log('Found movements:', data.length)

      // Get related data in parallel
      const [membersResult, typesResult, categoriesResult, currenciesResult, walletsResult] = await Promise.all([
        // Get creators data
        supabase
          .from('organization_members')
          .select(`
            id,
            users (
              id,
              full_name,
              email,
              avatar_url
            )
          `)
          .in('id', [...new Set(data.map(m => m.created_by).filter(Boolean))]),
        
        // Get movement types
        supabase
          .from('movement_concepts')
          .select('id, name')
          .in('id', [...new Set(data.map(m => m.type_id).filter(Boolean))]),
        
        // Get movement categories
        supabase
          .from('movement_concepts')
          .select('id, name')
          .in('id', [...new Set(data.map(m => m.category_id).filter(Boolean))]),
        
        // Get currencies
        supabase
          .from('organization_currencies')
          .select(`
            id,
            currencies (
              id,
              name,
              code
            )
          `)
          .in('id', [...new Set(data.map(m => m.currency_id).filter(Boolean))]),
        
        // Get wallets
        supabase
          .from('organization_wallets')
          .select('id, name')
          .in('id', [...new Set(data.map(m => m.wallet_id).filter(Boolean))])
      ]);

      // Create lookup maps
      const membersMap = new Map();
      membersResult.data?.forEach(member => {
        membersMap.set(member.id, {
          id: member.users?.id,
          full_name: member.users?.full_name,
          email: member.users?.email,
          avatar_url: member.users?.avatar_url
        });
      });

      const typesMap = new Map();
      typesResult.data?.forEach(type => {
        typesMap.set(type.id, type);
      });

      const categoriesMap = new Map();
      categoriesResult.data?.forEach(category => {
        categoriesMap.set(category.id, category);
      });

      const currenciesMap = new Map();
      currenciesResult.data?.forEach(orgCurrency => {
        currenciesMap.set(orgCurrency.id, orgCurrency.currencies);
      });

      const walletsMap = new Map();
      walletsResult.data?.forEach(wallet => {
        walletsMap.set(wallet.id, wallet);
      });

      // Transform the data with related information
      const transformedData = data.map((movement) => {
        const creator = membersMap.get(movement.created_by);
        const type = typesMap.get(movement.type_id);
        const category = categoriesMap.get(movement.category_id);
        const currency = currenciesMap.get(movement.currency_id);
        const wallet = walletsMap.get(movement.wallet_id);

        return {
          ...movement,
          creator,
          movement_data: {
            type,
            category,
            currency,
            wallet
          }
        }
      });

      console.log('Transformed movements:', transformedData.length);
      return transformedData as Movement[];
    },
    enabled: !!organizationId
  })
}