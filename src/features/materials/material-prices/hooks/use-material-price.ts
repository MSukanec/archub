/**
 * Use Material Price Hook
 * 
 * React Query hook para obtener el precio de un material.
 */

import { useQuery } from '@tanstack/react-query';
import { getMaterialPrice } from '../services/getMaterialPrice';

export function useMaterialPrice(materialId: string, organizationId: string) {
  return useQuery({
    queryKey: ['material-price', materialId, organizationId],
    queryFn: () => getMaterialPrice(materialId, organizationId),
    enabled: !!materialId && !!organizationId,
  });
}
