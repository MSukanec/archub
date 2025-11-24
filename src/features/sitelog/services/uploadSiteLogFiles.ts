import { uploadFile } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { SiteLogFileInput } from '../types';

/**
 * Sube archivos multimedia y los vincula a una bitácora usando la nueva arquitectura unificada de 3 buckets.
 * 
 * Proceso:
 * 1. Para cada archivo, usa uploadFile que:
 *    - Comprime imágenes automáticamente según el preset 'sitelog-photo'
 *    - Sube archivo a bucket 'private-assets'
 *    - Crea registro en 'media_files'
 *    - Crea vínculo en 'media_links' con site_log_id
 * 
 * Path de almacenamiento: private-assets/organizations/{org_id}/sitelogs/{project_id}/{unique_id}.ext
 * 
 * @param files - Array de archivos con título y descripción opcional
 * @param siteLogId - ID de la bitácora a la que pertenecen los archivos
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @param createdBy - ID del miembro de la organización que sube los archivos
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

  // Obtener el user_id de la sesión actual
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
  }

  for (const { file, title, description } of files) {
    try {
      if (!file || file.size === 0) {
        continue;
      }

      const metadata: Record<string, any> = {};
      if (title && title !== file.name) {
        metadata.custom_file_name = title;
      }

      await uploadFile(file, {
        entity: 'sitelog_attachment',
        organization_id: organizationId,
        project_id: projectId,
        user_id: userId,
        link_to: {
          project_id: projectId,
          sitelog_id: siteLogId,
        },
        category: 'sitelog_media',
        description: description || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      });
    } catch (error) {
      console.error('Error uploading sitelog file:', error);
      throw error;
    }
  }
}
