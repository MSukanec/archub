import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useContacts(organizationId?: string, contactTypeId?: string) {
  return useQuery({
    queryKey: ['contacts', organizationId, contactTypeId],
    queryFn: async () => {
      if (!supabase || !organizationId) throw new Error('Supabase client or organization ID not available')
      
      let query = supabase
        .from('contacts')
        .select(`
          *,
          contact_type:contact_types(name)
        `)
        .eq('organization_id', organizationId)
        .order('first_name')

      if (contactTypeId && contactTypeId !== 'all') {
        query = query.eq('contact_type_id', contactTypeId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
    },
    enabled: !!supabase && !!organizationId
  })
}