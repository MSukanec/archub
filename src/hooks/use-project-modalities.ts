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
 * 
 * @param organizationId - ID de la organización (opcional para compatibilidad legacy)
 */
export function useProjectModalities(organizationId?: string) {
  return useQuery<ProjectModality[]>({
    queryKey: organizationId ? ['project-modalities', organizationId] : ['project-modalities'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase not available')
      }

      let query = supabase
        .from('project_modalities')
        .select('*')
        .eq('is_deleted', false);

      // Si se proporciona organizationId, filtrar por organización
      if (organizationId) {
        query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      }

      const { data, error } = await query
        .order('is_default', { ascending: false })
        .order('name');

      if (error) {
        throw error
      }

      return data || []
    },
    enabled: !organizationId || !!organizationId, // Siempre habilitado si no se requiere orgId, o si se proporciona
  })
}