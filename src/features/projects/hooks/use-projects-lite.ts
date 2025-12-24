import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../services/getProjects';
import { projectsKeys } from '@/core/query-keys';
import { useProjectContext } from '@/stores/projectContext';

interface ProjectLite {
  id: string;
  name: string;
  color: string | null;
  status: string | null;
}

/**
 * Hook para obtener una lista ligera de proyectos (solo campos esenciales).
 * 
 * IMPORTANTE: Deriva del mismo cache base que useProjects usando `select`.
 * Esto garantiza sincronización automática cuando cualquier mutación actualiza el cache.
 * 
 * @param organizationId - ID de la organización (opcional, usa ProjectContext si no se proporciona)
 * @returns Query con array de proyectos lite
 */
export function useProjectsLite(organizationId?: string | undefined) {
  const { currentOrganizationId } = useProjectContext();
  
  const effectiveOrganizationId = organizationId || currentOrganizationId || undefined;
  
  return useQuery({
    queryKey: projectsKeys.list(effectiveOrganizationId),
    queryFn: () => getProjects(effectiveOrganizationId!),
    enabled: !!effectiveOrganizationId,
    staleTime: 5 * 60 * 1000,
    select: (projects): ProjectLite[] => (projects ?? []).map(p => ({
      id: p.id,
      name: p.name || '',
      color: p.color ?? null,
      status: p.status ?? null,
    })),
    placeholderData: (prev) => prev ?? [],
  });
}
