import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateContactType } from '../services';
import { CONTACT_TYPE_QUERY_KEYS } from '../constants';
import type { ContactTypeInput } from '../types';

interface UpdateContactTypeParams {
  typeId: string;
  input: ContactTypeInput;
}

export function useUpdateContactType(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ typeId, input }: UpdateContactTypeParams) =>
      updateContactType(typeId, organizationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_TYPE_QUERY_KEYS.lists() });
    },
  });
}
