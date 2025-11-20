import { useQuery } from '@tanstack/react-query';
import { getContactById } from '../services';
import { CONTACT_QUERY_KEYS } from '../constants';

export function useContact(
  organizationId: string | undefined,
  contactId: string | undefined
) {
  return useQuery({
    queryKey: CONTACT_QUERY_KEYS.detail(organizationId!, contactId!),
    queryFn: () => getContactById(contactId!, organizationId!),
    enabled: !!organizationId && !!contactId,
  });
}
