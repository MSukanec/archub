import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useCurrentUser } from './use-current-user'

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
      if (!supabase || !userId || !organizationId) return null

      const { data, error } = await supabase
        .from('user_organization_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single()

      if (error) {
        // Si no existe la fila, no es un error real
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data
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
      if (!supabase || !userId) {
        throw new Error('User not authenticated')
      }

      // Realizar UPSERT
      const { data, error } = await supabase
        .from('user_organization_preferences')
        .upsert(
          {
            user_id: userId,
            organization_id: organizationId,
            last_project_id: lastProjectId,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,organization_id'
          }
        )
        .select()
        .single()

      if (error) throw error
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