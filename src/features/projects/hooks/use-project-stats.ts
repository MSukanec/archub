import { useQuery } from '@tanstack/react-query';
import { getProjectStats } from '../services/getProjectStats';
import { projectsKeys } from '@/core/query-keys';
import { useCurrentUser } from '@/features/users/hooks';

/**
 * Hook para obtener las estadísticas de un proyecto.
 * 
 * Incluye contadores de documentos, bitácoras, presupuestos y movimientos.
 * Usa la organización del usuario actual.
 * 
 * @param projectId - ID del proyecto (puede ser null)
 * @returns Query con estadísticas del proyecto o null
 */
export function useProjectStats(projectId: string | null) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;

  return useQuery({
    queryKey: projectsKeys.stats(organizationId, projectId ?? undefined),
    queryFn: () => getProjectStats(projectId!, organizationId!),
    enabled: !!organizationId && !!projectId,
  });
}
