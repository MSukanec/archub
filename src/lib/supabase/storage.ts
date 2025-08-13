import { supabase } from '@/lib/supabase';

export const storageHelpers = {
  /**
   * Get public URL for a file in a public bucket
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Create a signed URL for accessing private files
   */
  async createSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Failed to create signed URL');
    
    return data.signedUrl;
  },

  /**
   * Download file as Blob from private bucket
   */
  async downloadAsBlob(bucket: string, path: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) throw error;
    if (!data) throw new Error('Failed to download file');
    
    return data;
  },

  /**
   * Fetch file as blob from public URL
   */
  async fetchAsBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return await response.blob();
  }
};

// Legacy exports for backward compatibility
export const uploadToBucket = async (bucket: string, path: string, file: File): Promise<string> => {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (error) throw error;
  
  return storageHelpers.getPublicUrl(bucket, path);
};

export const removeFromBucket = async (bucket: string, paths: string[]): Promise<void> => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths);
  
  if (error) throw error;
};

export const getPublicUrl = (bucket: string, path: string): string => {
  return storageHelpers.getPublicUrl(bucket, path);
};