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

      // For now, return empty array since movements table may not exist yet
      console.log('Fetching movements for:', { organizationId, projectId })
      return []
    },
    enabled: !!organizationId && !!projectId
  })
}