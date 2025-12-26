import { useQuery } from '@tanstack/react-query';
import { getSiteLogFiles } from '../services/getSiteLogFiles';

export function useSiteLogFiles(siteLogId?: string, organizationId?: string) {
  return useQuery({
    queryKey: ['sitelog-files', siteLogId, organizationId],
    queryFn: () => getSiteLogFiles(siteLogId!, organizationId!),
    enabled: !!siteLogId && !!organizationId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
}
