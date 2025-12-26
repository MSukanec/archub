import { useOptimisticMutation } from '@/core/save-engine';
import { setContactAvatar } from '../services';
import { contactsKeys } from '@/core/query-keys';
export function useSetContactAvatar(organizationId: string, contactId: string) {
  return useOptimisticMutation({
    mutationFn: (attachmentId: string) => setContactAvatar(contactId, attachmentId),
    queryKey: contactsKeys.list(organizationId),
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    additionalQueryKeys: [contactsKeys.detail(organizationId, contactId)],
    onSuccessMessage: 'Avatar actualizado',
    onErrorMessage: 'No se pudo actualizar el avatar',
  });
}
