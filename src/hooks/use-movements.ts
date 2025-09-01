import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Movement interface based on movements_view
interface Movement {
  id: string
  description: string
  amount: number
  exchange_rate: number
  created_at: string
  movement_date: string
  created_by: string
  organization_id: string
  project_id: string
  type_id: string
  category_id: string
  subcategory_id: string
  currency_id: string
  wallet_id: string
  is_conversion: boolean
  is_favorite: boolean
  conversion_group_id: string | null
  transfer_group_id: string | null
  project_name: string
  project_color: string
  currency_name: string
  currency_symbol: string
  currency_code: string
  currency_country: string
  wallet_name: string
  type_name: string
  category_name: string
  subcategory_name: string
  client: string | null
  partner: string | null
  subcontract: string | null
}

interface MovementWithData extends Movement {
  movement_data?: {
    creator?: {
      id: string
      full_name: string
      email: string
      avatar_url: string
    }
    type?: { id: string; name: string }
    category?: { id: string; name: string }
    subcategory?: { id: string; name: string }
    currency?: { id: string; name: string; code: string; symbol: string }
    wallet?: { id: string; name: string }
    project?: { id: string; name: string; color: string }
  }
}

export function useMovements(organizationId: string | null, projectId?: string | null) {
  return useQuery({
    queryKey: ['movements', organizationId, projectId],
    queryFn: async () => {
      if (!organizationId) return []

      console.log('Fetching movements for organization:', organizationId, 'project:', projectId)
      console.log('Project filter active:', !!projectId)

      // Get movements data from movements_view which includes all necessary joins
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
          client,
          partner,
          subcontract
        `)
        .eq('organization_id', organizationId)
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false });

      // If project is specified, filter by project
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

      // Get creators data only
      const [membersResult] = await Promise.all([
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
          .in('id', Array.from(new Set(data.map(m => m.created_by).filter(Boolean))))
      ]);

      // Create lookup map for creators
      const membersMap = new Map();
      membersResult.data?.forEach(member => {
        if (member.users) {
          membersMap.set(member.id, {
            id: member.users.id,
            full_name: member.users.full_name,
            email: member.users.email,
            avatar_url: member.users.avatar_url
          });
        }
      });

      // Map movements with enriched data using the view columns directly
      const enrichedMovements: MovementWithData[] = data.map(movement => ({
        ...movement,
        movement_data: {
          creator: membersMap.get(movement.created_by),
          type: { id: movement.type_id, name: movement.type_name },
          category: { id: movement.category_id, name: movement.category_name },
          subcategory: { id: movement.subcategory_id, name: movement.subcategory_name },
          currency: { 
            id: movement.currency_id, 
            name: movement.currency_name, 
            code: movement.currency_code, 
            symbol: movement.currency_symbol 
          },
          wallet: { id: movement.wallet_id, name: movement.wallet_name },
          project: { 
            id: movement.project_id, 
            name: movement.project_name, 
            color: movement.project_color 
          }
        }
      }));

      console.log('Enriched movements prepared:', enrichedMovements.length)
      return enrichedMovements as Movement[]
    },
    enabled: !!organizationId,
    refetchOnWindowFocus: false
  })
}

export function useToggleMovementFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ movementId, isFavorite }: { movementId: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('movements')
        .update({ is_favorite: !isFavorite })
        .eq('id', movementId)

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate movements queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['movements'] })
    }
  })
}