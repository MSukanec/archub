import { useQuery } from '@tanstack/react-query';
import { getContactTypes } from '../services';
import { CONTACT_TYPE_QUERY_KEYS } from '../constants';

export function useContactTypes(organizationId: string | undefined) {
  return useQuery({
    queryKey: CONTACT_TYPE_QUERY_KEYS.list(organizationId!),
    queryFn: () => getContactTypes(organizationId!),
    enabled: !!organizationId,
  });
}
