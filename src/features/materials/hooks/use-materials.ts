/**
 * Use Materials Hook
 * 
 * React Query hook para obtener lista de materiales.
 */

import { useQuery } from '@tanstack/react-query';
import { getMaterials } from '../services/getMaterials';
import { MATERIALS_QUERY_KEYS } from '../constants';
import { useProjectContext } from '@/stores/projectContext';

export function useMaterials() {
  const { currentOrganizationId } = useProjectContext();

  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.list(currentOrganizationId || ''),
    queryFn: getMaterials,
    enabled: !!currentOrganizationId,
  });
}
