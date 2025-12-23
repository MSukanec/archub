import { useOptimisticMutation } from '@/core/save-engine';
import { setContactAvatar } from '../services';
import { CONTACT_QUERY_KEYS } from '../constants';

interface SetAvatarParams {
  contactId: string;
  attachmentId: string;
}

export function useSetContactAvatar() {
  return useOptimisticMutation({
    mutationFn: ({ contactId, attachmentId }: SetAvatarParams) =>
      setContactAvatar(contactId, attachmentId),
    queryKey: CONTACT_QUERY_KEYS.all,
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    onSuccessMessage: 'Avatar actualizado correctamente',
    onErrorMessage: 'No se pudo actualizar el avatar',
  });
}
