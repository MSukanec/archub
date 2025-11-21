import { useQuery } from '@tanstack/react-query';
import { getContactAttachmentsForPersonnel } from '../services/getContactAttachmentsForPersonnel';
import { PERSONNEL_QUERY_KEYS } from '../constants';

export function useContactAttachmentsForPersonnel(avatarAttachmentIds: string[]) {
  return useQuery({
    queryKey: [...PERSONNEL_QUERY_KEYS.all, 'contact-attachments', avatarAttachmentIds.join(',')],
    queryFn: () => getContactAttachmentsForPersonnel(avatarAttachmentIds),
    enabled: avatarAttachmentIds.length > 0,
  });
}
