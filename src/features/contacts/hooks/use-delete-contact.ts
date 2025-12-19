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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ['contacts-for-partner', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['partner-contact-ids', variables.organizationId] });
    },
  });
}
