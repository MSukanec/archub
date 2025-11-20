import { useQuery } from '@tanstack/react-query';
import { getUserOrganizationPreferences } from '../services';
import { USER_ORGANIZATION_PREFERENCES_QUERY_KEYS } from '../constants';

export function useUserOrganizationPreferences(
  userId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.detail(userId!, organizationId!),
    queryFn: () => getUserOrganizationPreferences(userId!, organizationId!),
    enabled: !!userId && !!organizationId,
  });
}
