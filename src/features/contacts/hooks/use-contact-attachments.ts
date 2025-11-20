import { useQuery } from '@tanstack/react-query';
import { listContactAttachments } from '../services';
import { CONTACT_ATTACHMENT_QUERY_KEYS } from '../constants';

export function useContactAttachments(contactId: string | undefined) {
  return useQuery({
    queryKey: CONTACT_ATTACHMENT_QUERY_KEYS.list(contactId!),
    queryFn: () => listContactAttachments(contactId!),
    enabled: !!contactId,
  });
}
