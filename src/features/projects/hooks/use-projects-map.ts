import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { QUERY_KEYS } from '../constants/index';

/**
 * Hook para obtener un mapa de proyectos con colores.
 * Usado en la tabla de movimientos en modo GENERAL.
 * 
 * @param organizationId - ID de la organización
 * @returns Query con mapa de proyectos (id -> {id, name, color})
 */
export function useProjectsMap(organizationId: string | undefined) {
  return useQuery<Record<string, { id: string; name: string; color: string | null }>>({
    queryKey: [QUERY_KEYS.PROJECTS_MAP, organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) {
        throw new Error('Organization ID required');
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, color')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('is_deleted', false);
      
      if (error) {
        throw error;
      }
      
      // Transform to a map for easy lookup
      const projectsMap: Record<string, { id: string; name: string; color: string | null }> = {};
      
      data?.forEach((project: any) => {
        projectsMap[project.id] = {
          id: project.id,
          name: project.name,
          color: project.color
        };
      });
      
      return projectsMap;
    },
    enabled: !!organizationId && !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
