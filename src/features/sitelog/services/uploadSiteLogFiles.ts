import { uploadMediaFileV2 } from '@/features/media/services/uploadMediaFileV2';
import type { SiteLogFileInput } from '../types';

/**
 * Sube archivos multimedia y los vincula a una bitácora usando la nueva arquitectura (media_files + media_links).
 * 
 * Proceso:
 * 1. Para cada archivo, usa uploadMediaFileV2 que:
 *    - Sube archivo a bucket 'media'
 *    - Crea registro en 'media_files'
 *    - Crea vínculo en 'media_links' con site_log_id
 * 
 * @param files - Array de archivos con título y descripción opcional
 * @param siteLogId - ID de la bitácora a la que pertenecen los archivos
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @param createdBy - ID del miembro de la organización que sube los archivos (organization_member.id)
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

      // Preparar metadata con el título personalizado del usuario
      const metadata: Record<string, any> = {};
      if (title && title !== file.name) {
        metadata.custom_file_name = title; // Guardar título personalizado en metadata
      }

      // Usar el servicio V2 que maneja media_files + media_links
      await uploadMediaFileV2({
        file,
        organization_id: organizationId,
        created_by: createdBy,
        bucket: 'media',
        // Datos del link
        project_id: projectId,
        site_log_id: siteLogId,
        visibility: 'organization',
        description: description || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}
