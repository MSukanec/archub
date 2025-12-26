import { useOptimisticMutation } from '@/core/save-engine';
import { setContactAvatar } from '../services';
import { contactsKeys } from '@/core/query-keys';

interface SetAvatarParams {
  contactId: string;
  attachmentId: string;
  organizationId: string;
}

export function useSetContactAvatar(organizationId: string) {
  return useOptimisticMutation({
    mutationFn: ({ contactId, attachmentId }: Omit<SetAvatarParams, 'organizationId'>) =>
      setContactAvatar(contactId, attachmentId),
    queryKey: contactsKeys.list(organizationId),
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    onSuccessMessage: 'Avatar actualizado correctamente',
    onErrorMessage: 'No se pudo actualizar el avatar',
  });
}
