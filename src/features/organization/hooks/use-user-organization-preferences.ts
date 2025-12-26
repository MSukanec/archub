import { useQuery } from '@tanstack/react-query';
import { getUserOrganizationPreferences } from '../services';
import { userOrgPreferencesKeys } from '@/core/query-keys';
export function useUserOrganizationPreferences(
  userId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: userOrgPreferencesKeys.detail(userId, organizationId),
    queryFn: () => getUserOrganizationPreferences(userId!, organizationId!),
    enabled: !!userId && !!organizationId,
  });
}
