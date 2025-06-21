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
      if (!organizationId || !projectId) return []

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
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
          subcategory_id,
          currency_id,
          wallet_id,
          file_url,
          related_contact_id,
          related_task_id,
          is_conversion,
          users:created_by (
            id,
            full_name,
            email,
            avatar_url
          ),
          type:movement_concepts!movements_type_id_fkey (
            id,
            name
          ),
          category:movement_concepts!movements_category_id_fkey (
            id,
            name
          ),
          subcategory:movement_concepts!movements_subcategory_id_fkey (
            id,
            name
          ),
          currencies (
            id,
            name,
            code,
            symbol
          ),
          wallets (
            id,
            name
          )
        `)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching movements:', error)
        throw error
      }

      return data?.map(movement => ({
        ...movement,
        creator: movement.users,
        movement_data: {
          type: movement.type,
          category: movement.category,
          subcategory: movement.subcategory,
          currency: movement.currencies,
          wallet: movement.wallets
        }
      })) || []
    },
    enabled: !!organizationId && !!projectId
  })
}