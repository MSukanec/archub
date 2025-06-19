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
          currency_id,
          wallet_id,
          file_url,
          related_contact_id,
          related_task_id,
          is_conversion,
          organization_members!movements_created_by_fkey (
            id,
            users (
              id,
              full_name,
              email,
              avatar_url
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching movements:', error)
        throw error
      }

      // Transform the data to match our interface
      const transformedData = data?.map((movement: any) => ({
        ...movement,
        creator: movement.organization_members?.users || null
      })) || []

      return transformedData
    },
    enabled: !!organizationId && !!projectId
  })
}