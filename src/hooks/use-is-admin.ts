import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

export function useIsAdmin() {
  const { data: userData } = useCurrentUser()

  return useQuery({
    queryKey: ['is-admin', userData?.user?.id],
    queryFn: async () => {
      if (!supabase || !userData?.user?.id) return false

      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error checking admin status:', error)
        return false
      }

      return !!data // Returns true if user exists in admin_users table
    },
    enabled: !!userData?.user?.id,
  })
}