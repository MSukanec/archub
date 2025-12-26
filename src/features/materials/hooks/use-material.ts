/**
 * Use Material Hook
 * 
 * React Query hook para obtener un material específico por ID filtrado por organización.
 */

import { useQuery } from '@tanstack/react-query';
import { getMaterialById } from '../services/getMaterialById';
import { MATERIALS_QUERY_KEYS } from '../constants';

export function useMaterial(materialId: string, organizationId: string | undefined) {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.detail(materialId, organizationId),
    queryFn: () => getMaterialById(materialId, organizationId!),
    enabled: !!materialId && !!organizationId,
  });
}
