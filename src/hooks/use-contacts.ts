import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

export function useContacts() {
  const { userData, isLoading: userLoading } = useCurrentUser()

  console.log('useContacts hook called:', {
    hasSupabase: !!supabase,
    hasUserData: !!userData,
    hasOrganization: !!userData?.organization,
    organizationId: userData?.organization?.id,
    userLoading,
    enabled: !!supabase && !!userData?.organization?.id && !userLoading
  })

  return useQuery({
    queryKey: ['contacts', userData?.organization?.id],
    queryFn: async () => {
      console.log('Fetching contacts for organization:', userData?.organization?.id)
      
      if (!supabase || !userData?.organization?.id) {
        console.log('Skipping contacts fetch - missing supabase or organization ID')
        return []
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', userData.organization.id)
        .order('first_name', { ascending: true })

      if (error) {
        console.error('Error fetching contacts:', error)
        throw error
      }

      console.log('Contacts fetched successfully:', data?.length || 0, 'contacts')
      return data || []
    },
    enabled: !!supabase && !!userData?.organization?.id && !userLoading,
  })
}