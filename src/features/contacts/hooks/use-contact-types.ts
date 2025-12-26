import { useQuery } from '@tanstack/react-query';
import { getContactTypes } from '../services';
import { contactTypesKeys } from '@/core/query-keys';

export function useContactTypes(organizationId: string | undefined) {
  return useQuery({
    queryKey: contactTypesKeys.list(organizationId),
    queryFn: () => getContactTypes(organizationId!),
    enabled: !!organizationId,
  });
}
