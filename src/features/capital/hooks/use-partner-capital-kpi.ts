import { useQuery } from '@tanstack/react-query';
import { getPartnerCapitalKPI, type PartnerCapitalKPI } from '../services/getPartnerCapitalKPI';
import { capitalKeys } from '@/core/query-keys';

export function usePartnerCapitalKPI(organizationId?: string, options?: { enabled?: boolean }) {
  return useQuery<PartnerCapitalKPI[]>({
    queryKey: capitalKeys.kpiList(organizationId || ''),
    queryFn: () => getPartnerCapitalKPI(organizationId!),
    enabled: options?.enabled !== false && !!organizationId,
  });
}
