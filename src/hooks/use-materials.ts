import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from './use-current-user'

export function useMaterials() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          unit:units(name),
          category:material_categories(name)
        `)
        .order('name')

      if (error) {
        console.error('Error fetching materials:', error)
        throw error
      }

      return data || []
    },
    enabled: !!supabase
  })
}