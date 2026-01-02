import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useProjectContext } from '@/stores/projectContext'
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity'

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
  general_cost_id?: string
  general_cost?: string
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

export function useMovements(organizationId?: string | undefined, projectId?: string | undefined | null) {
  const { currentOrganizationId, selectedProjectId } = useProjectContext()
  
  // Use ProjectContext IDs as primary source, fallback to parameters
  const effectiveOrgId = organizationId || currentOrganizationId
  // If projectId is explicitly null, don't filter by project
  // If projectId is undefined and no second parameter passed, use selectedProjectId
  // If projectId is a valid string, use it for filtering
  const effectiveProjectId = projectId === null ? null : 
                             (arguments.length >= 2 ? projectId : selectedProjectId)
  
  return useQuery({
    queryKey: ['movements', effectiveOrgId, effectiveProjectId],
    queryFn: async () => {
      if (!effectiveOrgId) return []

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      let query = supabase
        .from('movements')
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
          partner,
          indirect_id,
          projects(name, color),
          currencies(id, name, code, symbol, country),
          organization_wallets(
            id,
            wallets(id, name)
          ),
          profiles(full_name, avatar_url),
          indirect_costs(id, name)
        `)
        
      query = query.eq('organization_id', effectiveOrgId)
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false });

      // If project is specified, filter by project
      // Only filter by project if projectId is explicitly provided and not null
      if (effectiveProjectId && effectiveProjectId !== 'null') {
        query = query.eq('project_id', effectiveProjectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching movements:', error)
        return []
      }

      if (!data || data.length === 0) {
        return []
      }

      // Transform the data from joined tables
      const transformedData = data.map((movement: any) => {
        return {
          ...movement,
          exchange_rate: movement.exchange_rate,
          creator: {
            full_name: movement.profiles?.full_name,
            avatar_url: movement.profiles?.avatar_url
          },
          movement_data: {
            type: movement.movement_types ? {
              id: movement.movement_types.id,
              name: movement.movement_types.name
            } : undefined,
            category: movement.movement_categories ? {
              id: movement.movement_categories.id,
              name: movement.movement_categories.name
            } : undefined,
            subcategory: movement.movement_subcategories ? {
              id: movement.movement_subcategories.id,
              name: movement.movement_subcategories.name
            } : undefined,
            currency: movement.currencies ? {
              id: movement.currencies.id,
              name: movement.currencies.name,
              code: movement.currencies.code,
              symbol: movement.currencies.symbol
            } : undefined,
            wallet: movement.organization_wallets?.wallets ? {
              id: movement.organization_wallets.id,
              name: movement.organization_wallets.wallets.name
            } : undefined
          },
          project_name: movement.projects?.name,
          project_color: movement.projects?.color,
          member: movement.profiles?.full_name,
          member_avatar: movement.profiles?.avatar_url,
          indirect: movement.indirect_costs?.name
        }
      });
      
      return transformedData as Movement[];
    },
    enabled: !!effectiveOrgId
  })
}

export function useToggleMovementFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ movementId, isFavorite, organizationId, userId }: { movementId: string, isFavorite: boolean, organizationId?: string, userId?: string }) => {
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

      return { movementId, isFavorite, organizationId, userId }
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })

      if (data.organizationId && data.userId) {
        await logActivity({
          organization_id: data.organizationId,
          user_id: data.userId,
          action: ACTIVITY_ACTIONS.UPDATE_MOVEMENT,
          target_table: TARGET_TABLES.MOVEMENTS,
          target_id: data.movementId,
          metadata: { is_favorite: data.isFavorite }
        })
      }
    }
  })
}