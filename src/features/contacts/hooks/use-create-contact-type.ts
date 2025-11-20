import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContactType } from '../services';
import { CONTACT_TYPE_QUERY_KEYS } from '../constants';
import type { ContactTypeInput } from '../types';

export function useCreateContactType(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ContactTypeInput) => createContactType(organizationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_TYPE_QUERY_KEYS.lists() });
    },
  });
}
