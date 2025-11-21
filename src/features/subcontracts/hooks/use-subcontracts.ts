import { useQuery } from '@tanstack/react-query';
import { getSubcontracts } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import type { SubcontractWithContact } from '../types';

export function useSubcontracts(projectId: string | null) {
  return useQuery<SubcontractWithContact[]>({
    queryKey: SUBCONTRACT_QUERY_KEYS.byProject(projectId || ''),
    queryFn: () => getSubcontracts(projectId!),
    enabled: !!projectId,
  });
}
