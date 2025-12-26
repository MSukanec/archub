import { supabase } from '@/lib/supabase';
import type { ContactAttachment } from '../types';
/**
 * DEPRECATED: contact_attachments table no longer exists
 * Use media_files + media_links instead
 */
export async function listContactAttachments(
  contactId: string
): Promise<ContactAttachment[]> {
  return [];
}
