import { useQuery } from '@tanstack/react-query';
import { getContactById } from '../services';
import { contactsKeys } from '@/core/query-keys';
export function useContact(
  organizationId: string | undefined,
  contactId: string | undefined
) {
  return useQuery({
    queryKey: contactsKeys.detail(organizationId, contactId),
    queryFn: () => getContactById(contactId!, organizationId!),
    enabled: !!organizationId && !!contactId,
  });
}
