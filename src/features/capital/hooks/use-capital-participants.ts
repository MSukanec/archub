import { useQuery } from '@tanstack/react-query';
import { getCapitalParticipants } from '../services/getCapitalParticipants';
import { capitalKeys } from '@/core/query-keys';
import type { CapitalParticipant } from '../types';

export function useCapitalParticipants(organizationId?: string, options?: { enabled?: boolean }) {
  return useQuery<CapitalParticipant[]>({
    queryKey: capitalKeys.participantsList(organizationId || ''),
    queryFn: () => getCapitalParticipants(organizationId!),
    enabled: options?.enabled !== false && !!organizationId,
  });
}

// Backward compatibility alias
export const usePartners = useCapitalParticipants;
