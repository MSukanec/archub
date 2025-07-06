import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

export function useContacts(organizationId?: string) {
  const { userData } = useCurrentUser()
  
  // Use provided organizationId or fall back to userData organization
  const orgId = organizationId || userData?.organization?.id

  return useQuery({
    queryKey: ['contacts', orgId],
    queryFn: async () => {
      if (!supabase || !orgId) return []

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', orgId)
        .order('first_name', { ascending: true })

      if (error) {
        console.error('Error fetching contacts:', error)
        throw error
      }

      return data || []
    },
    enabled: !!supabase && !!orgId,
  })
}