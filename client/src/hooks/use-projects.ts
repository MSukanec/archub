import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Project {
  id: string
  name: string
  status: string
  budget: number
  team_size: number
  created_at: string
  organization_id: string
  description?: string
  progress?: number
}

export function useProjects(organizationId: string | undefined) {
  return useQuery<Project[]>({
    queryKey: ['projects', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) {
        throw new Error('Organization ID required')
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error fetching projects:', error)
        throw error
      }
      
      return data || []
    },
    enabled: !!organizationId && !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}