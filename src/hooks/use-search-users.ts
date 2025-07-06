import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

export function useSearchUsers(query: string) {
  const { data: userData } = useCurrentUser()

  return useQuery({
    queryKey: ['searchUsers', query, userData?.organization?.id],
    queryFn: async () => {
      if (!supabase || !userData?.organization?.id || !query || query.length < 2) {
        return []
      }

      // Search users by name or email
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          organization_members!inner(
            organization_id,
            organizations(
              id,
              name
            )
          )
        `)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)

      if (error) {
        console.error('Error searching users:', error)
        throw error
      }

      return data || []
    },
    enabled: !!supabase && !!userData?.organization?.id && !!query && query.length >= 2,
  })
}