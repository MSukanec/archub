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
      
      // Additional frontend filter as security measure (similar to useMovements pattern)
      const filteredData = data?.filter(contact => contact.organization_id === userData.organization.id) || []
      
      console.log('Data before filter:', data?.length || 0)
      console.log('Data after filter:', filteredData.length)
      console.log('Organization ID used for filtering:', userData.organization.id)
      console.log('Sample unfiltered contact org IDs:', data?.slice(0, 3).map(c => c.organization_id))
      
      return filteredData
    },
    enabled: !!supabase && !!userData?.organization?.id && !userLoading,
  })
}