import { supabase } from '@/lib/supabase';
import { removeFromBucket } from '@/lib/supabase/storage';
/**
 * DEPRECATED: contact_attachments table no longer exists
 * Use media_files + media_links instead
 */
export async function deleteContactAttachment(
  attachmentId: string
): Promise<void> {
  throw new Error('deleteContactAttachment is deprecated. Use media_files + media_links instead.');
}
