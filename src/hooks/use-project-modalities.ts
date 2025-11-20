import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface ProjectModality {
  id: string
  name: string
  is_default: boolean
  created_at: string
  organization_id: string | null
}

/**
 * Hook legacy para mantener compatibilidad.
 * Para nuevas funcionalidades usar src/features/project-modalities/hooks/use-project-modalities.ts
 */
export function useProjectModalities() {
  return useQuery<ProjectModality[]>({
    queryKey: ['project-modalities'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase not available')
      }

      const { data, error } = await supabase
        .from('project_modalities')
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