import { supabase } from '@/lib/supabase';
import type { MediaFileInput, UploadMediaResult } from '../types';
import { nanoid } from 'nanoid';
/**
 * Sube un archivo a Supabase Storage y crea el registro en la base de datos.
 * 
 * Realiza las siguientes operaciones:
 * 1. Genera un nombre único para el archivo
 * 2. Sube el archivo al bucket de storage
 * 3. Obtiene la URL pública del archivo
 * 4. Crea el registro en la tabla project_media
 * 
 * @param input - Datos del archivo a subir
 * @returns Resultado con id, file_url y file_path del archivo subido
 * @throws {Error} Si falla alguna operación de Supabase
 */
export async function uploadMediaFile(input: MediaFileInput): Promise<UploadMediaResult> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  const { file, project_id, organization_id, visibility, description, created_by } = input;
  // Generate unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${nanoid()}.${fileExt}`;
  const filePath = `${organization_id}/${project_id}/${fileName}`;
  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  if (uploadError) throw uploadError;
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);
  // Create database record
  const { data, error: dbError } = await supabase
    .from('project_media')
    .insert({
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_path: filePath,
      project_id,
      organization_id,
      visibility,
      description,
      created_by
    })
    .select('id, file_url, file_path')
    .single();
  if (dbError) throw dbError;
  return data;
}
