import { useMutation, useQueryClient } from '@tanstack/react-query';
import { softDeleteContactType } from '../services';
import { CONTACT_TYPE_QUERY_KEYS } from '../constants';

export function useDeleteContactType(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (typeId: string) => softDeleteContactType(typeId, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_TYPE_QUERY_KEYS.lists() });
    },
  });
}
