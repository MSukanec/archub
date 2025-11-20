import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteContactAttachment } from '../services';
import { CONTACT_ATTACHMENT_QUERY_KEYS } from '../constants';

export function useDeleteContactAttachment(contactId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => deleteContactAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: CONTACT_ATTACHMENT_QUERY_KEYS.list(contactId) 
      });
    },
  });
}
