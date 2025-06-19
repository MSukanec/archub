import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface MovementConcept {
  id: string
  name: string
  description?: string
  parent_id?: string
  created_at: string
}

export function useMovementConcepts(type: 'types' | 'categories', parentId?: string) {
  return useQuery({
    queryKey: ['movement-concepts', type, parentId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      let query = supabase
        .from('movement_concepts')
        .select('id, name, description, parent_id, created_at')
        .order('name')

      if (type === 'types') {
        query = query.is('parent_id', null)
      } else if (type === 'categories' && parentId) {
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
    enabled: type === 'types' || (type === 'categories' && !!parentId)
  })
}