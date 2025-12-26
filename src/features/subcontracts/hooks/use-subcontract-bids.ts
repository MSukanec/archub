import { useQuery } from '@tanstack/react-query';
import { getSubcontractBids } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import type { SubcontractBidWithContact } from '../types';

export function useSubcontractBids(subcontractId: string | null) {
  return useQuery<SubcontractBidWithContact[]>({
    queryKey: SUBCONTRACT_QUERY_KEYS.bids(subcontractId || ''),
    queryFn: () => getSubcontractBids(subcontractId!),
    enabled: !!subcontractId,
  });
}
