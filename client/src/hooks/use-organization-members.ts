import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface OrganizationMember {
  id: string
  user_id: string
  organization_id: string
  role_id: string
  is_active: boolean
  joined_at: string
  last_active_at: string
  users: {
    id: string
    full_name: string
    email: string
    avatar_url: string
  } | null
}

export function useOrganizationMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return []

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          organization_id,
          role_id,
          is_active,
          joined_at,
          last_active_at,
          users!inner (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching organization members:', error)
        throw error
      }

      return data || []
    },
    enabled: !!organizationId
  })
}