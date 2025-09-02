import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// NOTE: For activity logging integration, import logActivity from '@/utils/logActivity'
// and add logging calls in mutation onSuccess handlers as needed

interface Movement {
  id: string
  description: string
  amount: number
  exchange_rate?: number
  created_at: string
  movement_date: string
  created_by: string
  organization_id: string
  project_id: string
  type_id: string
  category_id: string
  subcategory_id?: string
  currency_id: string
  wallet_id: string
  is_favorite?: boolean
  conversion_group_id?: string
  transfer_group_id?: string
  project_name?: string
  project_color?: string
  currency_name?: string
  currency_symbol?: string
  currency_code?: string
  currency_country?: string
  wallet_name?: string
  type_name?: string
  category_name?: string
  subcategory_name?: string
  partner?: string
  subcontract?: string
  client?: string
  member?: string
  member_avatar?: string
  indirect_id?: string
  indirect?: string
  movement_data?: {
    type?: {
      id: string
      name: string
    }
    category?: {
      id: string
      name: string
    }
    subcategory?: {
      id: string
      name: string
    }
    currency?: {
      id: string
      name: string
      code: string
      symbol?: string
    }
    wallet?: {
      id: string
      name: string
    }
  }
  creator?: {
    full_name?: string
    avatar_url?: string
  }
}

export function useMovements(organizationId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: ['movements', organizationId, projectId],
    queryFn: async () => {
      if (!organizationId) return []

      console.log('Fetching movements for organization:', organizationId, 'project:', projectId)
      console.log('Project filter active:', !!projectId)

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Get movements data from the view
      let query = supabase
        .from('movements_view')
        .select(`
          id,
          description,
          amount,
          exchange_rate,
          created_at,
          movement_date,
          created_by,
          organization_id,
          project_id,
          type_id,
          category_id,
          subcategory_id,
          currency_id,
          wallet_id,
          is_conversion,
          is_favorite,
          conversion_group_id,
          transfer_group_id,
          project_name,
          project_color,
          currency_name,
          currency_symbol,
          currency_code,
          currency_country,
          wallet_name,
          type_name,
          category_name,
          subcategory_name,
          partner,
          subcontract,
          client,
          member,
          member_avatar,
          indirect_id,
          indirect
        `)
        .eq('organization_id', organizationId)
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false });

      // If project is specified, filter by project
      // Only filter by project if projectId is explicitly provided and not null
      if (projectId && projectId !== 'null') {
        console.log('Filtering by project_id:', projectId);
        query = query.eq('project_id', projectId);
      } else {
        console.log('Not filtering by project - showing all movements for organization');
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
      if (data.length > 0) {
        console.log('Sample movement data:', {
          project_id: data[0]?.project_id,
          organization_id: data[0]?.organization_id,
          description: data[0]?.description
        })
        console.log('Expected organization_id:', organizationId)
        console.log('Expected project_id:', projectId)
      }

      // All data now comes from the view, no need for additional queries

      // Transform the data using view columns
      const transformedData = data.map((movement) => {
        return {
          ...movement,
          exchange_rate: movement.exchange_rate,
          creator: {
            full_name: movement.member,
            avatar_url: movement.member_avatar
          },
          movement_data: {
            type: {
              id: movement.type_id,
              name: movement.type_name
            },
            category: {
              id: movement.category_id,
              name: movement.category_name
            },
            subcategory: movement.subcategory_id ? {
              id: movement.subcategory_id,
              name: movement.subcategory_name
            } : undefined,
            currency: {
              id: movement.currency_id,
              name: movement.currency_name,
              code: movement.currency_code,
              symbol: movement.currency_symbol
            },
            wallet: {
              id: movement.wallet_id,
              name: movement.wallet_name
            }
          },
          project_name: movement.project_name,
          project_color: movement.project_color,
          partner: movement.partner,
          subcontract: movement.subcontract,
          client: movement.client,
          indirect_id: movement.indirect_id,
          indirect: movement.indirect
        }
      });

      console.log('Transformed movements:', transformedData.length);
      
      // Debug: Log movements with indirect data
      const indirectMovements = transformedData.filter(m => m.category_name === 'Indirectos');
      if (indirectMovements.length > 0) {
        console.log('🔍 Indirect movements debug:', indirectMovements.map(m => ({
          id: m.id,
          description: m.description,
          category_name: m.category_name,
          indirect_id: m.indirect_id,
          indirect: m.indirect
        })));
      }
      
      return transformedData as Movement[];
    },
    enabled: !!organizationId
  })
}

export function useToggleMovementFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ movementId, isFavorite }: { movementId: string, isFavorite: boolean }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase
        .from('movements')
        .update({ is_favorite: isFavorite })
        .eq('id', movementId)

      if (error) {
        throw error
      }

      return { movementId, isFavorite }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })
    }
  })
}