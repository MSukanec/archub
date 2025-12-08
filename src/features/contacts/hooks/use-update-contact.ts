import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateContact } from '../services';
import { upsertContactTypeLinks } from '../services';
import { CONTACT_QUERY_KEYS } from '../constants';
import { PERSONNEL_QUERY_KEYS } from '@/features/personnel/constants';
import type { ContactInput } from '../types';

interface UpdateContactInput extends Partial<ContactInput> {
  contact_type_ids?: string[];
}

export function useUpdateContact(
  organizationId: string,
  contactId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateContactInput) => {
      const { contact_type_ids, ...contactData } = input;
      const contact = await updateContact(contactId, organizationId, contactData);

      if (contact_type_ids !== undefined) {
        await upsertContactTypeLinks(contactId, organizationId, contact_type_ids);
      }

      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ 
        queryKey: CONTACT_QUERY_KEYS.detail(organizationId, contactId) 
      });
      // Also invalidate personnel queries since contacts are linked to personnel
      queryClient.invalidateQueries({ queryKey: PERSONNEL_QUERY_KEYS.all });
    },
  });
}
