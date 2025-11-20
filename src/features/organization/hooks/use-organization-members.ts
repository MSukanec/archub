import { useQuery } from '@tanstack/react-query';
import { getOrganizationMembers } from '../services';
import { ORGANIZATION_QUERY_KEYS } from '../constants';

export function useOrganizationMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ORGANIZATION_QUERY_KEYS.members(organizationId!),
    queryFn: () => getOrganizationMembers(organizationId!),
    enabled: !!organizationId,
  });
}
