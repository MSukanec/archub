import { useQuery } from '@tanstack/react-query';
import { getOrganizationActivity } from '../services';
import { organizationKeys } from '@/core/query-keys';

export function useOrganizationActivity(organizationId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.activity(organizationId),
    queryFn: () => getOrganizationActivity(organizationId!),
    enabled: !!organizationId,
    retry: 0,
    staleTime: Infinity,
    gcTime: 600000,
  });
}
