import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface MovementConceptLite {
  id: string
  name: string
  view_mode: string
  type: string | null
}

export function useMovementConceptsLite(organizationId: string | undefined) {
  return useQuery<MovementConceptLite[]>({
    queryKey: ['movement-concepts-lite', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) {
        throw new Error('Supabase client not initialized or organization ID missing')
      }

      // Get both system concepts (is_system = true) AND organization's own concepts
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('id, name, view_mode, type')
        .or(`and(is_system.eq.true,organization_id.is.null),organization_id.eq.${organizationId}`)
        .order('name')

      if (error) {
        throw error
      }

      return data || []
    },
    enabled: !!organizationId && !!supabase,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    placeholderData: (prev) => prev ?? [],
  })
}