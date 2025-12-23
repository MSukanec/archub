import { useOptimisticMutation } from '@/core/save-engine';
import { uploadContactAttachment } from '../services';
import { CONTACT_ATTACHMENT_QUERY_KEYS } from '../constants';
import type { ContactAttachmentInput } from '../types';

export function useUploadContactAttachment(contactId: string, createdBy: string) {
  return useOptimisticMutation({
    mutationFn: (input: ContactAttachmentInput) => 
      uploadContactAttachment(contactId, input, createdBy),
    queryKey: CONTACT_ATTACHMENT_QUERY_KEYS.list(contactId),
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    onSuccessMessage: 'Adjunto subido',
    onErrorMessage: 'No se pudo subir el adjunto',
  });
}
