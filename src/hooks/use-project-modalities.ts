import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface ProjectModality {
  id: string
  name: string
  description?: string
  created_at: string
}

export function useProjectModalities() {
  return useQuery<ProjectModality[]>({
    queryKey: ['project-modalities'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase not available')
      }

      const { data, error } = await supabase
        .from('modalities')
        .select('*')
        .order('name')

      if (error) {
        throw error
      }

      return data || []
    }
  })
}