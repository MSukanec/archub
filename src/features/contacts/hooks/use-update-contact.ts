import { useOptimisticMutation } from '@/core/save-engine';
import { updateContact, upsertContactTypeLinks } from '../services';
import { contactsKeys } from '@/core/query-keys';
import { PERSONNEL_QUERY_KEYS } from '@/features/personnel/constants';
import type { ContactInput } from '../types';

interface UpdateContactInput extends Partial<ContactInput> {
  contact_type_ids?: string[];
}

export function useUpdateContact(
  organizationId: string,
  contactId: string
) {
  return useOptimisticMutation({
    mutationFn: async (input: UpdateContactInput) => {
      const { contact_type_ids, ...contactData } = input;
      const contact = await updateContact(contactId, organizationId, contactData);

      if (contact_type_ids !== undefined) {
        await upsertContactTypeLinks(contactId, organizationId, contact_type_ids);
      }

      return contact;
    },
    queryKey: contactsKeys.list(organizationId),
    optimisticUpdate: (oldData, input) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map((c: any) => 
        c.id === contactId ? { ...c, ...input } : c
      );
    },
    additionalQueryKeys: [
      contactsKeys.detail(organizationId, contactId),
      PERSONNEL_QUERY_KEYS.all,
    ],
    onSuccessMessage: 'Contacto actualizado',
    onErrorMessage: 'No se pudo actualizar el contacto',
  });
}
