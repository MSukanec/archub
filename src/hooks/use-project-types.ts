import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface ProjectType {
  id: string
  name: string
  description?: string
  created_at: string
}

export function useProjectTypes() {
  return useQuery<ProjectType[]>({
    queryKey: ['project-types'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase not available')
      }

      const { data, error } = await supabase
        .from('project_types')
        .select('*')
        .order('name')

      if (error) {
        throw error
      }

      return data || []
    }
  })
}