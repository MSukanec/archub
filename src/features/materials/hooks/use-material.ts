/**
 * Use Material Hook
 * 
 * React Query hook para obtener un material específico por ID.
 */

import { useQuery } from '@tanstack/react-query';
import { getMaterialById } from '../services/getMaterialById';
import { MATERIALS_QUERY_KEYS } from '../constants';

export function useMaterial(materialId: string) {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.detail(materialId),
    queryFn: () => getMaterialById(materialId),
    enabled: !!materialId,
  });
}
