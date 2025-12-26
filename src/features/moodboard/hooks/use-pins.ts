import { useQuery } from '@tanstack/react-query';
import { getPins } from '../services/getPins';
import { QUERY_KEYS } from '../constants';

export function usePins(organizationId?: string, projectId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PINS, organizationId, projectId],
    queryFn: () => getPins(organizationId, projectId),
    enabled: !!organizationId,
  });
}
