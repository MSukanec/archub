/**
 * Use Material Categories Hook
 * 
 * React Query hook para obtener categorías de materiales.
 */

import { useQuery } from '@tanstack/react-query';
import { getMaterialCategories } from '../services/getMaterialCategories';

export function useMaterialCategories() {
  return useQuery({
    queryKey: ['material-categories'],
    queryFn: getMaterialCategories,
  });
}
