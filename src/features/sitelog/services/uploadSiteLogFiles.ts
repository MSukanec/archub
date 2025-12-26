import { uploadFile } from '@/lib/storage';
import type { SiteLogFileInput } from '../types';
export interface CompressionStats {
  totalOriginalSize: number;
  totalCompressedSize: number;
  filesCompressed: number;
  totalFiles: number;
}
/**
 * Sube archivos multimedia y los vincula a una bitácora usando la nueva arquitectura unificada de 3 buckets.
 * 
 * Proceso:
 * 1. Para cada archivo, usa uploadFile que:
 *    - Comprime imágenes automáticamente según el preset 'sitelog-photo'
 *    - Sube archivo a bucket 'private-assets'
 *    - Crea registro en 'media_files'
 *    - Crea vínculo en 'media_links'con site_log_id
 * 
 * Path de almacenamiento: private-assets/organizations/{org_id}/sitelogs/{project_id}/{unique_id}.ext
 * 
 * @param files - Array de archivos con título y descripción opcional
 * @param siteLogId - ID de la bitácora a la que pertenecen los archivos
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @param createdByMemberId - ID del organization_member que sube los archivos
 * @returns CompressionStats con información de los archivos comprimidos
 * @throws {Error} Si falla la subida o creación de registro
 */
export async function uploadSiteLogFiles(
  files: SiteLogFileInput[],
  siteLogId: string,
  projectId: string,
  organizationId: string,
  createdByMemberId: string
): Promise<CompressionStats> {
  if (!files || files.length === 0) {
    throw new Error('No hay archivos para subir');
  }
  const stats: CompressionStats = {
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    filesCompressed: 0,
    totalFiles: files.length
  };
  for (const { file, title, description } of files) {
    try {
      if (!file || file.size === 0) {
        continue;
      }
      const metadata: Record<string, any> = {};
      if (title && title !== file.name) {
        metadata.custom_file_name = title;
      }
      const result = await uploadFile(file, {
        entity: 'sitelog_attachment',
        organization_id: organizationId,
        project_id: projectId,
        created_by_member_id: createdByMemberId,
        link_to: {
          project_id: projectId,
          sitelog_id: siteLogId,
        },
        category: 'photo',
        description: description || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      });
      // Acumular stats
      if (result.compressionStats) {
        stats.totalOriginalSize += result.compressionStats.originalSize;
        stats.totalCompressedSize += result.compressionStats.compressedSize;
        if (result.compressionStats.wasCompressed) {
          stats.filesCompressed++;
        }
      }
    } catch (error) {
      console.error('Error uploading sitelog file:', error);
      throw error;
    }
  }
  return stats;
}
