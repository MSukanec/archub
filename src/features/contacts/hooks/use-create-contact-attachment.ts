import { useOptimisticMutation } from '@/core/save-engine';
import { uploadContactAttachment } from '../services';
import { contactsKeys } from '@/core/query-keys';
import type { ContactAttachmentInput } from '../types';
interface CreateAttachmentParams {
  file: File;
  category: 'dni_front'| 'dni_back'| 'document'| 'photo'| 'other';
  createdBy: string;
  metadata?: any;
}
export function useCreateContactAttachment(contactId: string, organizationId: string) {
  return useOptimisticMutation({
    mutationFn: async ({ file, category, createdBy, metadata }: CreateAttachmentParams) => {
      const input: ContactAttachmentInput = {
        file,
        category,
        metadata,
      };
      return uploadContactAttachment(contactId, input, createdBy);
    },
    queryKey: contactsKeys.attachmentList(contactId),
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    additionalQueryKeys: [contactsKeys.detail(organizationId, contactId)],
    onSuccessMessage: 'Adjunto subido correctamente',
    onErrorMessage: 'No se pudo subir el adjunto',
  });
}
