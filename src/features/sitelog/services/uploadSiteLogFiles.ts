import { supabase } from '@/lib/supabase';
import type { SiteLogFileInput } from '../types';

/**
 * Sube archivos multimedia a Supabase Storage y los vincula a una bitácora.
 * 
 * Proceso:
 * 1. Sube cada archivo a bucket 'media'
 * 2. Crea registro en tabla 'project_media'
 * 3. Vincula con site_log_id
 * 
 * @param files - Array de archivos con título y descripción opcional
 * @param siteLogId - ID de la bitácora a la que pertenecen los archivos
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @param createdBy - ID del usuario que sube los archivos
 * @throws {Error} Si falla la subida o creación de registro
 */
export async function uploadSiteLogFiles(
  files: SiteLogFileInput[],
  siteLogId: string,
  projectId: string,
  organizationId: string,
  createdBy: string
): Promise<void> {
  if (!files || files.length === 0) {
    throw new Error('No hay archivos para subir');
  }

  for (const { file, title, description } of files) {
    try {
      if (!file || file.size === 0) {
        continue;
      }

      const extension = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const fileType: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';

      const insertData = {
        file_name: title,
        file_type: fileType,
        file_url: urlData.publicUrl,
        file_path: filePath,
        file_size: file.size,
        description: description || null,
        created_by: createdBy,
        organization_id: organizationId,
        project_id: projectId,
        site_log_id: siteLogId,
        visibility: 'organization'
      };

      const { error: dbError } = await supabase
        .from('project_media')
        .insert(insertData);

      if (dbError) {
        await supabase.storage
          .from('media')
          .remove([filePath]);
        throw dbError;
      }
    } catch (error) {
      throw error;
    }
  }
}
