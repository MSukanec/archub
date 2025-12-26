import { supabase } from '@/lib/supabase';
import { uploadToBucket, removeFromBucket } from '@/lib/supabase/storage';
import type { ContactAttachment, ContactAttachmentInput } from '../types';
import { CONTACT_STORAGE_BUCKET } from '../constants';
import { slugifyFileName } from '../utils';
/**
 * DEPRECATED: contact_attachments table no longer exists
 * Use media_files + media_links instead
 */
export async function uploadContactAttachment(
  contactId: string,
  input: ContactAttachmentInput,
  createdBy: string
): Promise<ContactAttachment> {
  throw new Error('uploadContactAttachment is deprecated. Use media_files + media_links instead.');
}
