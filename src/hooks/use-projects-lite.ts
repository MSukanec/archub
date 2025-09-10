import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ProjectLite {
  id: string
  name: string
  color: string | null
  status: string
}

export function useProjectsLite(organizationId: string | undefined) {
  return useQuery<ProjectLite[]>({
    queryKey: ['projects-lite', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) {
        throw new Error('Organization ID required')
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, color, status')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
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