import { supabase } from '@/lib/supabase';
export interface ContactMediaFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string | null;
  bucket: string;
  file_path: string;
  created_at: string;
}
export interface ContactMediaLink {
  id: string;
  media_file_id: string;
  contact_id: string;
  category: string | null;
  description: string | null;
  created_at: string;
  media_file: ContactMediaFile;
}
async function generateSignedUrl(bucket: string, filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);
    
    if (error || !data?.signedUrl) {
      return null;
    }
    return data.signedUrl;
  } catch {
    return null;
  }
}
export async function getContactAttachments(
  contactId: string,
  organizationId: string
): Promise<ContactMediaLink[]> {
  if (!supabase || !contactId || !organizationId) {
    return [];
  }
  const { data, error } = await supabase
    .from('media_links')
    .select(`
      id,
      media_file_id,
      contact_id,
      category,
      description,
      created_at,
      media_file:media_files!media_file_id (
        id,
        file_name,
        file_type,
        file_size,
        file_url,
        bucket,
        file_path,
        created_at
      )
    `)
    .eq('contact_id', contactId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching contact attachments:', error);
    throw error;
  }
  const links = (data || []).map((link: any) => ({
    ...link,
    media_file: Array.isArray(link.media_file) ? link.media_file[0] : link.media_file,
  }));
  const linksWithSignedUrls = await Promise.all(
    links.map(async (link: ContactMediaLink) => {
      if (!link.media_file) return link;
      
      const mediaFile = link.media_file;
      
      if (mediaFile.bucket === 'public-assets'&& mediaFile.file_url) {
        return link;
      }
      
      const signedUrl = await generateSignedUrl(mediaFile.bucket, mediaFile.file_path);
      
      return {
        ...link,
        media_file: {
          ...mediaFile,
          file_url: signedUrl || mediaFile.file_url,
        },
      };
    })
  );
  return linksWithSignedUrls;
}
