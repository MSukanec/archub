import { useQuery } from '@tanstack/react-query';
import { getProjectsLite } from '../services/getProjectsLite';
import { QUERY_KEYS } from '../constants';
import { useProjectContext } from '@/stores/projectContext';

/**
 * Hook para obtener una lista ligera de proyectos (solo campos esenciales).
 * 
 * Versión optimizada para selectores y listas simples.
 * Usa ProjectContext como fuente principal de organizationId.
 * 
 * @param organizationId - ID de la organización (opcional, usa ProjectContext si no se proporciona)
 * @returns Query con array de proyectos lite
 */
export function useProjectsLite(organizationId?: string | undefined) {
  const { currentOrganizationId } = useProjectContext();
  
  // Use ProjectContext organizationId as primary source, fallback to parameter
  const effectiveOrganizationId = organizationId || currentOrganizationId;
  
  return useQuery({
    queryKey: [QUERY_KEYS.PROJECTS_LITE, effectiveOrganizationId],
    queryFn: () => getProjectsLite(effectiveOrganizationId!),
    enabled: !!effectiveOrganizationId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    placeholderData: (prev) => prev ?? [],
  });
}
