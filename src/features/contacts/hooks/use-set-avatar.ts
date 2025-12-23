import { useOptimisticMutation } from '@/core/save-engine';
import { setContactAvatar } from '../services';
import { CONTACT_QUERY_KEYS } from '../constants';

export function useSetContactAvatar(organizationId: string, contactId: string) {
  return useOptimisticMutation({
    mutationFn: (attachmentId: string) => setContactAvatar(contactId, attachmentId),
    queryKey: CONTACT_QUERY_KEYS.lists(),
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    additionalQueryKeys: [CONTACT_QUERY_KEYS.detail(organizationId, contactId)],
    onSuccessMessage: 'Avatar actualizado',
    onErrorMessage: 'No se pudo actualizar el avatar',
  });
}
