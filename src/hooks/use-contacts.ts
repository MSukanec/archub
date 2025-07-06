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
        .select('*')
        .eq('organization_id', userData.organization.id)
        .order('first_name', { ascending: true })

      if (error) {
        console.error('Error fetching contacts:', error)
        throw error
      }
      
      return data || []
    },
    enabled: !!supabase && !!userData?.organization?.id && !userLoading,
  })
}