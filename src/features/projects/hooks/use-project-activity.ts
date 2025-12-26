import { useQuery } from '@tanstack/react-query';
import { getProjectActivity } from '../services/getProjectActivity';
import { projectsKeys } from '@/core/query-keys';
import { useCurrentUser } from '@/hooks/use-current-user';
/**
 * Hook para obtener la actividad reciente del proyecto.
 * 
 * Devuelve datos de actividad para los últimos 7 días.
 * Usa la organización del usuario actual.
 * 
 * @param projectId - ID del proyecto (puede ser null)
 * @returns Query con array de datos de actividad
 */
export function useProjectActivity(projectId: string | null) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;
  return useQuery({
    queryKey: projectsKeys.activity(organizationId, projectId ?? undefined),
    queryFn: () => getProjectActivity(projectId!, organizationId!),
    enabled: !!organizationId && !!projectId,
  });
}
