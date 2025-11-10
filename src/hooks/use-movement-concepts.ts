import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface MovementConcept {
  id: string
  name: string
  parent_id?: string
  view_mode?: string

  is_system?: boolean
}

export function useMovementConcepts(type: 'types' | 'categories' | 'parent', parentId?: string) {
  return useQuery({
    queryKey: ['movement-concepts', type, parentId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      let query = supabase
        .from('movement_concepts')
        .select('id, name, parent_id, view_mode, is_system')
        .order('name')

      if (type === 'types' || type === 'parent') {
        // Get parent concepts (types) - those with null parent_id
        query = query.is('parent_id', null)
      } else if (type === 'categories' && parentId) {
        // Get child concepts (categories) - those with specific parent_id
        query = query.eq('parent_id', parentId)
      } else {
        return []
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching movement concepts:', error)
        throw error
      }

      return data || []
    },
    enabled: type === 'types' || type === 'parent' || (type === 'categories' && !!parentId)
  })
}