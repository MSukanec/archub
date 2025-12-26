import { useQuery } from '@tanstack/react-query';
import { getContacts } from '../services';
import { contactsKeys } from '@/core/query-keys';
export function useContacts(organizationId: string | undefined) {
  return useQuery({
    queryKey: contactsKeys.list(organizationId),
    queryFn: () => getContacts(organizationId!),
    enabled: !!organizationId,
    staleTime: 30000,
    gcTime: 600000,
  });
}
