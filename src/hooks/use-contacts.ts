import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'

export function useContacts() {
  const { data: userData, isLoading: userLoading } = useCurrentUser()
  const { currentOrganizationId } = useProjectContext()

  return useQuery({
    queryKey: ['contacts', currentOrganizationId],
    queryFn: async () => {
      if (!supabase || !currentOrganizationId) {
        return []
      }

      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          linked_user:users!contacts_linked_user_id_fkey(
            id,
            full_name,
            email,
            avatar_url,
            organization_members!inner(
              organizations(
                id,
                name
              )
            )
          ),
          contact_types:contact_type_links!contact_type_links_contact_id_fkey(
            contact_type:contact_types!contact_type_links_contact_type_id_fkey(
              id,
              name
            )
          )
        `)
        .eq('organization_id', currentOrganizationId)
        .order('first_name', { ascending: true })

      if (error) {
        console.error('Error fetching contacts:', error)
        // Return empty array instead of throwing to avoid breaking the UI
        return []
      }
      
      // Transform the contact_types data structure and filter out current user
      const transformedData = data?.map(contact => ({
        ...contact,
        contact_types: contact.contact_types?.map((link: any) => link.contact_type).filter(Boolean) || []
      })).filter(contact => contact.linked_user_id !== userData?.user?.id) || []
      
      return transformedData
    },
    enabled: !!supabase && !!currentOrganizationId && !userLoading,
    retry: 0, // Don't retry on error to avoid spamming failed requests
    staleTime: Infinity, // Cache forever to avoid repeated errors
    gcTime: 600000
  })
}