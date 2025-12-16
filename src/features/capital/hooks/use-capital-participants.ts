import { useQuery } from '@tanstack/react-query';
import { getCapitalParticipants } from '../services/getCapitalParticipants';
import { CAPITAL_QUERY_KEYS } from '../constants';
import type { CapitalParticipant } from '../types';

export function useCapitalParticipants(organizationId?: string, options?: { enabled?: boolean }) {
  return useQuery<CapitalParticipant[]>({
    queryKey: CAPITAL_QUERY_KEYS.participants(organizationId || ''),
    queryFn: () => getCapitalParticipants(organizationId!),
    enabled: options?.enabled !== false && !!organizationId,
  });
}

// Backward compatibility alias
export const usePartners = useCapitalParticipants;
