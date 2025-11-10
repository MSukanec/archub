import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

export function useAdminPermissions() {
  const { data: userData } = useCurrentUser()

  return useQuery({
    queryKey: ['admin-permissions', userData?.user?.auth_id],
    queryFn: async () => {
      if (!userData?.user?.auth_id || !supabase) {
        return { isAdmin: false, loading: false }
      }

      // Check if user exists in admin_users view
      const { data, error } = await supabase
        .from('admin_users')
        .select('auth_id')
        .eq('auth_id', userData.user.auth_id)

      if (error) {
        console.error('Error checking admin permissions:', error)
        return { isAdmin: false, loading: false }
      }

      return { 
        isAdmin: !!(data && data.length > 0), 
        loading: false 
      }
    },
    enabled: !!userData?.user?.auth_id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

export function useIsAdmin(): boolean {
  const { data } = useAdminPermissions()
  const { data: userData } = useCurrentUser()
  
  // Temporal: hacer que el usuario archub@archub.com sea admin para testing
  if (userData?.user?.email === "archub@archub.com") {
    return true
  }
  
  return data?.isAdmin || false
}