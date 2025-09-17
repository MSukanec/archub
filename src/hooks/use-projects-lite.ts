import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useProjectContext } from '@/stores/projectContext'

export interface ProjectLite {
  id: string
  name: string
  color: string | null
  status: string
}

export function useProjectsLite(organizationId?: string | undefined) {
  const { currentOrganizationId } = useProjectContext()
  
  // Use ProjectContext organizationId as primary source, fallback to parameter
  const effectiveOrganizationId = organizationId || currentOrganizationId
  
  return useQuery<ProjectLite[]>({
    queryKey: ['projects-lite', effectiveOrganizationId],
    queryFn: async () => {
      if (!supabase || !effectiveOrganizationId) {
        throw new Error('Organization ID required')
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, color, status')
        .eq('organization_id', effectiveOrganizationId)
        .eq('is_active', true)
        .order('name')
      
      if (error) {
        throw error
      }
      
      return data || []
    },
    enabled: !!effectiveOrganizationId && !!supabase,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    placeholderData: (prev) => prev ?? [],
  })
}