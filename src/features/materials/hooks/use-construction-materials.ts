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
  selectedPhase?: string,
  filterTaskIds?: string[]
) {
  const params: ConstructionMaterialsParams = {
    projectId,
    selectedPhase,
    filterTaskIds,
  };

  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.construction(projectId, selectedPhase, filterTaskIds),
    queryFn: () => getConstructionMaterials(params),
    enabled: !!projectId,
  });
}
