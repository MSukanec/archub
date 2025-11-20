import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContact } from '../services';
import { upsertContactTypeLinks } from '../services';
import { CONTACT_QUERY_KEYS } from '../constants';
import type { ContactInput } from '../types';

interface CreateContactInput extends ContactInput {
  contact_type_ids?: string[];
}

export function useCreateContact(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const { contact_type_ids, ...contactData } = input;
      const contact = await createContact(organizationId, contactData);

      if (contact_type_ids && contact_type_ids.length > 0) {
        await upsertContactTypeLinks(contact.id, organizationId, contact_type_ids);
      }

      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.lists() });
    },
  });
}
