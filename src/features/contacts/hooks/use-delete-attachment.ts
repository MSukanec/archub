import { useOptimisticMutation } from '@/core/save-engine';
import { deleteContactAttachment } from '../services';
import { CONTACT_ATTACHMENT_QUERY_KEYS } from '../constants';

export function useDeleteContactAttachment(contactId: string) {
  return useOptimisticMutation({
    mutationFn: (attachmentId: string) => deleteContactAttachment(attachmentId),
    queryKey: CONTACT_ATTACHMENT_QUERY_KEYS.list(contactId),
    optimisticUpdate: (oldData, attachmentId) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((a: any) => a.id !== attachmentId);
    },
    onSuccessMessage: 'Adjunto eliminado',
    onErrorMessage: 'No se pudo eliminar el adjunto',
  });
}
