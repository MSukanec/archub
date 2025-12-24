import { useOptimisticMutation } from '@/core/save-engine';
import { createContact, upsertContactTypeLinks } from '../services';
import { contactsKeys } from '@/core/query-keys';
import type { ContactInput } from '../types';

interface CreateContactInput extends ContactInput {
  contact_type_ids?: string[];
}

export function useCreateContact(organizationId: string) {
  return useOptimisticMutation({
    mutationFn: async (input: CreateContactInput) => {
      const { contact_type_ids, ...contactData } = input;
      const contact = await createContact(organizationId, contactData);

      if (contact_type_ids && contact_type_ids.length > 0) {
        await upsertContactTypeLinks(contact.id, organizationId, contact_type_ids);
      }

      return contact;
    },
    queryKey: contactsKeys.list(organizationId),
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    onSuccessMessage: 'Contacto creado',
    onErrorMessage: 'No se pudo crear el contacto',
  });
}
