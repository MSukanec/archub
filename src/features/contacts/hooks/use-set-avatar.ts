import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setContactAvatar } from '../services';
import { CONTACT_QUERY_KEYS } from '../constants';

export function useSetContactAvatar(organizationId: string, contactId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => setContactAvatar(contactId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ 
        queryKey: CONTACT_QUERY_KEYS.detail(organizationId, contactId) 
      });
    },
  });
}
