import type { SupabaseClient } from '@supabase/supabase-js';
import type { BucketName } from './types';

/**
 * Get a URL for a file in a bucket.
 * - For public buckets: returns permanent public URL
 * - For private/social buckets: generates temporary signed URL
 * 
 * Automatically detects environment and uses appropriate Supabase client.
 * Can also accept a client parameter for explicit control.
 */
export async function getFileUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600, // 1 hour by default
  client?: SupabaseClient  // Optional client parameter
): Promise<string> {
  // If no client provided, detect environment and use appropriate client
  if (!client) {
    if (typeof window === 'undefined') {
      // Backend: use supabaseAdmin
      const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
      client = supabaseAdmin;
    } else {
      // Frontend: use supabase
      const { supabase } = await import('@/lib/supabase');
      client = supabase;
    }
  }
  
  // public-assets and social-assets: public buckets, use public URL
  // Note: social-assets bucket must be configured as "Public bucket" in Supabase settings
  if (bucket === 'public-assets' || bucket === 'social-assets') {
    return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  
  // private-assets: use signed URLs (requires authentication)
  const { data, error } = await client.storage
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
