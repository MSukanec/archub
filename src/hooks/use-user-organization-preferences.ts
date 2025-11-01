import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useCurrentUser } from './use-current-user'
import { supabase } from '@/lib/supabase'

interface UserOrganizationPreferences {
  id: string
  user_id: string
  organization_id: string
  last_project_id: string | null
  created_at: string
  updated_at: string
}

export function useUserOrganizationPreferences(organizationId: string | undefined) {
  const { data: userData } = useCurrentUser()
  const userId = userData?.user?.id

  return useQuery({
    queryKey: ['user-organization-preferences', userId, organizationId],
    queryFn: async (): Promise<UserOrganizationPreferences | null> => {
      if (!userId || !organizationId) return null

      // Get session with error handling
      let session = null;
      try {
        const { data } = await supabase.auth.getSession();
        session = data?.session;
      } catch (error) {
        // Silently handle auth errors
        return null;
      }
      
      if (!session) {
        return null; // Return null instead of throwing
      }

      const response = await fetch(`/api/user/organization-preferences?user_id=${userId}&organization_id=${organizationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // No preferences found
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    },
    enabled: !!userId && !!organizationId,
  })
}

export function useUpdateUserOrganizationPreferences() {
  const { data: userData } = useCurrentUser()
  const userId = userData?.user?.id

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      lastProjectId 
    }: { 
      organizationId: string
      lastProjectId: string | null 
    }) => {
      if (!userId) {
        throw new Error('User not authenticated')
      }

      // Get session with error handling
      let session = null;
      try {
        const { data } = await supabase.auth.getSession();
        session = data?.session;
      } catch (error) {
        // Silently handle auth errors
        return null;
      }
      
      if (!session) {
        return null; // Return null instead of throwing
      }

      const response = await fetch('/api/user/update-organization-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': userId,
        },
        body: JSON.stringify({
          organization_id: organizationId,
          last_project_id: lastProjectId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    },
    onSuccess: (data) => {
      // Invalidar cache para actualizar datos
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userId, data.organization_id] 
      })
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    }
  })
}

export function useGetLastProjectForOrganization(organizationId: string | undefined) {
  const { data: preferences } = useUserOrganizationPreferences(organizationId)
  return preferences?.last_project_id || null
}