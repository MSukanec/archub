import { supabase } from '@/lib/supabase';

export interface ContactAttachmentForPersonnel {
  id: string;
  contact_id: string;
  organization_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  category: string;
  metadata?: any;
  created_by: string;
  created_at: string;
}

export async function getContactAttachmentsForPersonnel(
  avatarAttachmentIds: string[]
): Promise<ContactAttachmentForPersonnel[]> {
  if (!supabase || avatarAttachmentIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('contact_attachments')
    .select('*')
    .in('id', avatarAttachmentIds);

  if (error) {
    throw new Error(`Error fetching contact attachments: ${error.message}`);
  }

  return data || [];
}
