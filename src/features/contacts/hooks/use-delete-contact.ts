import { useMutation, useQueryClient } from '@tanstack/react-query';
import { softDeleteContact } from '../services';
import { CONTACT_QUERY_KEYS } from '../constants';

export function useDeleteContact(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => softDeleteContact(contactId, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.lists() });
    },
  });
}
