import { useOptimisticMutation } from '@/core/save-engine';
import { deleteContactAttachment } from '../services';
import { contactsKeys } from '@/core/query-keys';
export function useDeleteContactAttachment(contactId: string, organizationId: string) {
  return useOptimisticMutation({
    mutationFn: (attachmentId: string) => deleteContactAttachment(attachmentId),
    queryKey: contactsKeys.attachmentList(contactId),
    optimisticUpdate: (oldData, attachmentId) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((a: any) => a.id !== attachmentId);
    },
    additionalQueryKeys: [contactsKeys.detail(organizationId, contactId)],
    onSuccessMessage: 'Adjunto eliminado correctamente',
    onErrorMessage: 'No se pudo eliminar el adjunto',
  });
}
