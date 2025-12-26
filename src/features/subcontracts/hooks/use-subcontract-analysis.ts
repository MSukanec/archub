import { useQuery } from '@tanstack/react-query';
import { getSubcontractAnalysis, type SubcontractAnalysisData } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
export function useSubcontractAnalysis(projectId: string | null) {
  return useQuery<SubcontractAnalysisData[]>({
    queryKey: SUBCONTRACT_QUERY_KEYS.analysis(projectId || ''),
    queryFn: () => getSubcontractAnalysis(projectId!),
    enabled: !!projectId,
  });
}
