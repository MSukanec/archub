import { useQuery } from '@tanstack/react-query';
import { listContactAttachments } from '../services';
import { contactsKeys } from '@/core/query-keys';

export function useContactAttachments(contactId: string | undefined) {
  return useQuery({
    queryKey: contactsKeys.attachmentList(contactId),
    queryFn: () => listContactAttachments(contactId!),
    enabled: !!contactId,
  });
}
