import { useOptimisticMutation } from '@/core/save-engine/useOptimisticMutation';
import { updateUserOrganizationPreferences } from '../services';
import { USER_ORGANIZATION_PREFERENCES_QUERY_KEYS } from '../constants';
import type { UpdateUserOrganizationPreferencesInput } from '../types';

export function useUpdateUserOrganizationPreferences(userId: string | undefined, organizationId?: string) {
  const queryKey = userId && organizationId 
    ? USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.detail(userId, organizationId)
    : ['user-org-preferences-placeholder'];

  return useOptimisticMutation({
    mutationFn: (input: UpdateUserOrganizationPreferencesInput) => 
      updateUserOrganizationPreferences(userId!, input),
    queryKey,
    optimisticUpdate: (oldData: any, input: UpdateUserOrganizationPreferencesInput) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        last_project_id: input.lastProjectId,
        updated_at: new Date().toISOString()
      };
    },
    additionalQueryKeys: [['current-user']],
  });
}
