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
          )
        `)
        .eq('organization_id', userData.organization.id)
        .order('first_name', { ascending: true })

      if (error) {
        throw error
      }
      
      return data || []
    },
    enabled: !!supabase && !!userData?.organization?.id && !userLoading,
  })
}