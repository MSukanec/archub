import { uploadMediaFileV2 } from '@/features/media/services/uploadMediaFileV2';

export interface GalleryFileInput {
  file: File;
  title: string;
  description?: string;
}

/**
 * Sube múltiples archivos de galería usando la nueva arquitectura (media_files + media_links).
 * 
 * Wrapper para mantener compatibilidad con código existente mientras se usa
 * internamente uploadMediaFileV2.
 * 
 * @param files - Array de archivos a subir
 * @param projectId - ID del proyecto (puede ser null)
 * @param organizationId - ID de la organización
 * @param createdBy - ID del organization_member (NO user_id)
 * @param visibility - Nivel de visibilidad del archivo
 */
export async function uploadGalleryFiles(
  files: GalleryFileInput[],
  projectId: string | null,
  organizationId: string,
  createdBy: string,
  visibility: 'organization' | 'project' = 'organization'
): Promise<void> {
  if (!files || files.length === 0) {
    throw new Error('No hay archivos para subir');
  }

  // Subir archivos en paralelo para mejor performance
  const uploadPromises = files.map(async ({ file, title, description }) => {
    try {
      // Validate file first
      if (!file || file.size === 0) {
        return;
      }

      // Usar el servicio V2 que maneja media_files + media_links
      await uploadMediaFileV2({
        file,
        organization_id: organizationId,
        created_by: createdBy,
        bucket: 'media',
        project_id: projectId || undefined,
        visibility,
        description: description || title, // Usar title como descripción si no hay descripción
      });
    } catch (error) {
      throw error;
    }
  });

  // Esperar a que todos los archivos se suban
  await Promise.all(uploadPromises);
}