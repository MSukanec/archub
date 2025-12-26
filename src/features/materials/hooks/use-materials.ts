/**
 * Use Materials Hook
 * 
 * React Query hook para obtener lista de materiales filtrados por organización.
 */
import { useQuery } from '@tanstack/react-query';
import { getMaterials } from '../services/getMaterials';
import { MATERIALS_QUERY_KEYS } from '../constants';
export function useMaterials(organizationId: string | undefined) {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.list(organizationId || ''),
    queryFn: () => getMaterials(organizationId!),
    enabled: !!organizationId,
  });
}
