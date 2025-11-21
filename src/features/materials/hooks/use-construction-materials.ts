/**
 * Use Construction Materials Hook
 * 
 * React Query hook para obtener materiales calculados de construcción por proyecto.
 */

import { useQuery } from '@tanstack/react-query';
import { getConstructionMaterials } from '../services/getConstructionMaterials';
import { MATERIALS_QUERY_KEYS } from '../constants';
import type { ConstructionMaterialsParams } from '../types';

export function useConstructionMaterials(
  projectId: string,
  organizationId: string,
  selectedPhase?: string,
  filterTaskIds?: string[]
) {
  const params: ConstructionMaterialsParams = {
    projectId,
    selectedPhase,
    filterTaskIds,
    organizationId,
  };

  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.construction(projectId, organizationId, selectedPhase, filterTaskIds),
    queryFn: () => getConstructionMaterials(params),
    enabled: !!projectId && !!organizationId,
  });
}
