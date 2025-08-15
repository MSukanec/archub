import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ProjectPersonnel {
  id: string
  project_id: string
  contact_id: string
  notes?: string
  contact: {
    id: string
    first_name: string
    last_name: string
    organization_id: string
  }
}

export function useProjectPersonnel(projectId?: string) {
  return useQuery({
    queryKey: ['project-personnel', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) {
        return []
      }

      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          id,
          project_id,
          contact_id,
          notes,
          contact:contacts(
            id,
            first_name,
            last_name,
            organization_id
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching project personnel:', error)
        throw error
      }

      return data || []
    },
    enabled: !!projectId,
  })
}