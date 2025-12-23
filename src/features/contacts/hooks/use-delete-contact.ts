import { useOptimisticMutation } from '@/core/save-engine';
import { softDeleteContact } from '../services';
import { CONTACT_QUERY_KEYS } from '../constants';

interface DeleteContactParams {
  contactId: string;
  organizationId: string;
}

export function useDeleteContact() {
  return useOptimisticMutation({
    mutationFn: ({ contactId, organizationId }: DeleteContactParams) => 
      softDeleteContact(contactId, organizationId),
    queryKey: CONTACT_QUERY_KEYS.lists(),
    optimisticUpdate: (oldData, { contactId }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((c: any) => c.id !== contactId);
    },
    onSuccessMessage: 'Contacto eliminado',
    onErrorMessage: 'No se pudo eliminar el contacto',
  });
}
