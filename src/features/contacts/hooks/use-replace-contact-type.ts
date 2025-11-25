import { useMutation, useQueryClient } from '@tanstack/react-query';
import { replaceContactType } from '../services';
import { CONTACT_TYPE_QUERY_KEYS, CONTACT_QUERY_KEYS } from '../constants';

export function useReplaceContactType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ oldTypeId, newTypeId, organizationId }: { oldTypeId: string; newTypeId: string; organizationId: string }) => 
      replaceContactType(oldTypeId, newTypeId, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_TYPE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.lists() });
    },
  });
}
