import { useQuery } from '@tanstack/react-query';
import { getPartners } from '../services/getPartners';
import { PARTNER_QUERY_KEYS } from '../constants';
import type { Partner } from '../types';

export function usePartners(organizationId?: string, options?: { enabled?: boolean }) {
  return useQuery<Partner[]>({
    queryKey: PARTNER_QUERY_KEYS.partners(organizationId || ''),
    queryFn: () => getPartners(organizationId!),
    enabled: options?.enabled !== false && !!organizationId,
  });
}
