import { useOptimisticMutation } from '@/core/save-engine';
import { deleteContactAttachment } from '../services';
import { CONTACT_ATTACHMENT_QUERY_KEYS, CONTACT_QUERY_KEYS } from '../constants';

export function useDeleteContactAttachment() {
  return useOptimisticMutation({
    mutationFn: (attachmentId: string) => deleteContactAttachment(attachmentId),
    queryKey: CONTACT_ATTACHMENT_QUERY_KEYS.all,
    optimisticUpdate: (oldData, attachmentId) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((a: any) => a.id !== attachmentId);
    },
    additionalQueryKeys: [CONTACT_QUERY_KEYS.all],
    onSuccessMessage: 'Adjunto eliminado correctamente',
    onErrorMessage: 'No se pudo eliminar el adjunto',
  });
}
