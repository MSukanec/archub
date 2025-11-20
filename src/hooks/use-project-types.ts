import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface ProjectType {
  id: string
  name: string
  category?: string | null
  icon?: string | null
  color?: string | null
  created_at: string
  is_default: boolean
  organization_id: string | null
}

/**
 * Hook legacy para mantener compatibilidad.
 * Para nuevas funcionalidades usar src/features/project-types/hooks/use-project-types.ts
 */
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
        .eq('is_deleted', false)
        .order('is_default', { ascending: false })
        .order('name')

      if (error) {
        throw error
      }

      return data || []
    }
  })
}