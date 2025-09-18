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

      console.log('🔧 Fetching project types...')
      const { data, error } = await supabase
        .from('project_types')
        .select('*')
        .order('name')

      if (error) {
        console.error('🔧 Error fetching project types:', error)
        throw error
      }

      console.log('🔧 Project types fetched:', data?.length || 0, 'items')
      return data || []
    }
  })
}