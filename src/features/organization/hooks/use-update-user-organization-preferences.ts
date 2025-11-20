import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { updateUserOrganizationPreferences } from '../services';
import { USER_ORGANIZATION_PREFERENCES_QUERY_KEYS } from '../constants';
import type { UpdateUserOrganizationPreferencesInput } from '../types';

export function useUpdateUserOrganizationPreferences(userId: string | undefined) {
  return useMutation({
    mutationFn: (input: UpdateUserOrganizationPreferencesInput) => 
      updateUserOrganizationPreferences(userId!, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.detail(userId!, data.organization_id) 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });
}
