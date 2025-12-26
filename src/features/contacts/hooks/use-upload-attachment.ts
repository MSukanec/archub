import { useOptimisticMutation } from '@/core/save-engine';
import { uploadContactAttachment } from '../services';
import { contactsKeys } from '@/core/query-keys';
import type { ContactAttachmentInput } from '../types';
export function useUploadContactAttachment(contactId: string, createdBy: string) {
  return useOptimisticMutation({
    mutationFn: (input: ContactAttachmentInput) => 
      uploadContactAttachment(contactId, input, createdBy),
    queryKey: contactsKeys.attachmentList(contactId),
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    onSuccessMessage: 'Adjunto subido',
    onErrorMessage: 'No se pudo subir el adjunto',
  });
}
