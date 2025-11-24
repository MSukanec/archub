import { supabase } from '@/lib/supabase';
import type { BucketName } from './types';

/**
 * Get a URL for a file in a bucket.
 * - For public buckets: returns permanent public URL
 * - For private/social buckets: generates temporary signed URL
 */
export async function getFileUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600 // 1 hour by default
): Promise<string> {
  if (bucket === 'public-assets') {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  
  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }
  
  return data.signedUrl;
}

/**
 * Helper to get URL from a media_file record.
 * - If file_url exists (public buckets), use it
 * - Otherwise, generate signed URL (private/social buckets)
 */
export async function getMediaFileUrl(
  media_file: { bucket: BucketName; file_path: string; file_url?: string | null },
  expiresIn: number = 3600
): Promise<string> {
  if (media_file.file_url) {
    return media_file.file_url;
  }
  
  return await getFileUrl(media_file.bucket as BucketName, media_file.file_path, expiresIn);
}
