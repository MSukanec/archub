import { useMutation, useQueryClient } from '@tanstack/react-query';
import { softDeleteContact } from '../services';
import { CONTACT_QUERY_KEYS } from '../constants';

interface DeleteContactParams {
  contactId: string;
  organizationId: string;
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, organizationId }: DeleteContactParams) => 
      softDeleteContact(contactId, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.lists() });
    },
  });
}
