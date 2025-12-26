import { useQuery } from '@tanstack/react-query';
import { getContacts, getContactById } from '../services/contacts';
import { CLIENT_QUERY_KEYS } from '../constants';

export function useContacts(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['contacts', organizationId],
    queryFn: () => getContacts(organizationId!),
    enabled: !!organizationId,
  });
}

export function useContact(
  contactId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: ['contacts', contactId],
    queryFn: () => getContactById(contactId!, organizationId!),
    enabled: !!contactId && !!organizationId,
  });
}
