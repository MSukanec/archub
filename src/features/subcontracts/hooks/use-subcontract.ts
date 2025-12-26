import { useQuery } from '@tanstack/react-query';
import { getSubcontract } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import type { SubcontractWithContact } from '../types';

export function useSubcontract(subcontractId: string | null) {
  return useQuery<SubcontractWithContact | null>({
    queryKey: SUBCONTRACT_QUERY_KEYS.detail(subcontractId || ''),
    queryFn: () => getSubcontract(subcontractId!),
    enabled: !!subcontractId,
  });
}
