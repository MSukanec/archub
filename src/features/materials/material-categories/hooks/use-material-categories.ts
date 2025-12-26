/**
 * Use Material Categories Hook
 * 
 * React Query hook para obtener categorías de materiales.
 * Categories are system-wide (not org-scoped) but we scope the query key for consistency.
 */
import { useQuery } from '@tanstack/react-query';
import { getMaterialCategories } from '../services/getMaterialCategories';
import { MATERIALS_QUERY_KEYS } from '../../constants';
export function useMaterialCategories(organizationId: string | undefined) {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.categories(organizationId || ''),
    queryFn: getMaterialCategories,
    enabled: !!organizationId,
  });
}
