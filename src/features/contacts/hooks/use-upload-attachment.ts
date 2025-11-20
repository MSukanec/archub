import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadContactAttachment } from '../services';
import { CONTACT_ATTACHMENT_QUERY_KEYS } from '../constants';
import type { ContactAttachmentInput } from '../types';

export function useUploadContactAttachment(contactId: string, createdBy: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ContactAttachmentInput) => 
      uploadContactAttachment(contactId, input, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: CONTACT_ATTACHMENT_QUERY_KEYS.list(contactId) 
      });
    },
  });
}
