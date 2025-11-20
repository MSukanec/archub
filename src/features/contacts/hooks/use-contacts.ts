import { useQuery } from '@tanstack/react-query';
import { getContacts } from '../services';
import { CONTACT_QUERY_KEYS } from '../constants';

export function useContacts(organizationId: string | undefined) {
  return useQuery({
    queryKey: CONTACT_QUERY_KEYS.list(organizationId!),
    queryFn: () => getContacts(organizationId!),
    enabled: !!organizationId,
    staleTime: 30000,
    gcTime: 600000,
  });
}
