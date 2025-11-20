import { useQuery } from '@tanstack/react-query';
import { getProjectStats } from '../services/getProjectStats';
import { QUERY_KEYS } from '../constants';
import { useCurrentUser } from '@/hooks/use-current-user';

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
    queryKey: [QUERY_KEYS.PROJECT_STATS, organizationId, projectId],
    queryFn: () => getProjectStats(projectId!, organizationId!),
    enabled: !!organizationId && !!projectId,
  });
}
