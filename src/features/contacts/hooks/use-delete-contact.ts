import { useOptimisticMutation } from '@/core/save-engine';
import { softDeleteContact } from '../services';
import { contactsKeys } from '@/core/query-keys';

interface DeleteContactParams {
  contactId: string;
  organizationId: string;
}

export function useDeleteContact(organizationId: string) {
  return useOptimisticMutation({
    mutationFn: ({ contactId, organizationId }: DeleteContactParams) => 
      softDeleteContact(contactId, organizationId),
    queryKey: contactsKeys.list(organizationId),
    optimisticUpdate: (oldData, { contactId }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((c: any) => c.id !== contactId);
    },
    onSuccessMessage: 'Contacto eliminado',
    onErrorMessage: 'No se pudo eliminar el contacto',
  });
}
