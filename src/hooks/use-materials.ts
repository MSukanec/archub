import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from './use-current-user'

export function useMaterials() {
  const { data: userData } = useCurrentUser()
  
  return useQuery({
    queryKey: ['materials', userData?.organization?.id],
    queryFn: async () => {
      if (!supabase || !userData?.organization?.id) {
        return []
      }

      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          unit:units(name),
          category:material_categories(name)
        `)
        .eq('organization_id', userData.organization.id)
        .order('name')

      if (error) {
        console.error('Error fetching materials:', error)
        throw error
      }

      return data || []
    },
    enabled: !!userData?.organization?.id && !!supabase
  })
}