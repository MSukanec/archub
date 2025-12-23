import { useOptimisticMutation } from '@/core/save-engine';
import { uploadContactAttachment } from '../services';
import { CONTACT_ATTACHMENT_QUERY_KEYS, CONTACT_QUERY_KEYS } from '../constants';
import type { ContactAttachmentInput } from '../types';

interface CreateAttachmentParams {
  contactId: string;
  file: File;
  category: 'dni_front' | 'dni_back' | 'document' | 'photo' | 'other';
  createdBy: string;
  metadata?: any;
}

export function useCreateContactAttachment() {
  return useOptimisticMutation({
    mutationFn: async ({ contactId, file, category, createdBy, metadata }: CreateAttachmentParams) => {
      const input: ContactAttachmentInput = {
        file,
        category,
        metadata,
      };
      return uploadContactAttachment(contactId, input, createdBy);
    },
    queryKey: CONTACT_ATTACHMENT_QUERY_KEYS.all,
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    additionalQueryKeys: [CONTACT_QUERY_KEYS.all],
    onSuccessMessage: 'Adjunto subido correctamente',
    onErrorMessage: 'No se pudo subir el adjunto',
  });
}
