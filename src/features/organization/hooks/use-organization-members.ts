import { useQuery } from '@tanstack/react-query';
import { getOrganizationMembers } from '../services';
import { organizationKeys } from '@/core/query-keys';
export function useOrganizationMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.members(organizationId),
    queryFn: () => getOrganizationMembers(organizationId!),
    enabled: !!organizationId,
  });
}
