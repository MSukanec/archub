import { supabase } from '@/lib/supabase';

export async function uploadToBucket(bucket: string, path: string, file: File): Promise<{ path: string }> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  return { path };
}

export async function removeFromBucket(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Error al eliminar archivo: ${error.message}`);
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}