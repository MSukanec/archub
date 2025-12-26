import { useQuery } from '@tanstack/react-query';
import { getContactAttachments, type ContactMediaLink } from '../services/getContactAttachments';
import { contactsKeys } from '@/core/query-keys';
export function useContactAttachments(
  contactId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery<ContactMediaLink[]>({
    queryKey: contactsKeys.attachmentList(organizationId, contactId),
    queryFn: () => getContactAttachments(contactId!, organizationId!),
    enabled: !!contactId && !!organizationId,
  });
}
