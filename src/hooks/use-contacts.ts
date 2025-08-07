import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

export function useContacts() {
  const { data: userData, isLoading: userLoading } = useCurrentUser()



  return useQuery({
    queryKey: ['contacts', userData?.organization?.id],
    queryFn: async () => {
      if (!supabase || !userData?.organization?.id) {
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
        .eq('organization_id', userData.organization.id)
        .not('linked_user_id', 'eq', userData.id)
        .order('first_name', { ascending: true })

      if (error) {
        console.error('Error fetching contacts:', error)
        throw error
      }
      
      // Transform the contact_types data structure
      const transformedData = data?.map(contact => ({
        ...contact,
        contact_types: contact.contact_types?.map((link: any) => link.contact_type).filter(Boolean) || []
      })) || []
      
      return transformedData
    },
    enabled: !!supabase && !!userData?.organization?.id && !userLoading,
  })
}