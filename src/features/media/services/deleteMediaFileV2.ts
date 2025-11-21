import { supabase } from '@/lib/supabase';

/**
 * Elimina un archivo usando la nueva arquitectura (media_files + media_links).
 * 
 * Proceso:
 * 1. Elimina el registro de media_links (relación)
 * 2. Verifica si quedan otros links al mismo archivo
 * 3. Si no quedan links, hace soft delete en media_files y elimina del storage
 * 
 * @param linkId - ID del registro en media_links (NO el media_file_id)
 * @returns void
 * @throws {Error} Si falla alguna operación de Supabase
 */
export async function deleteMediaFileV2(linkId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  try {
    console.log('[deleteMediaFileV2] Attempting to delete link:', linkId);
    
    // 1 y 2. Eliminar el link y obtener media_file_id en una sola operación (evita problemas con RLS)
    const { data: deletedLink, error: deleteLinkError } = await supabase
      .from('media_links')
      .delete()
      .eq('id', linkId)
      .select('media_file_id')
      .single();

    console.log('[deleteMediaFileV2] Delete result:', { deletedLink, deleteLinkError });

    if (deleteLinkError) throw deleteLinkError;
    if (!deletedLink) throw new Error('Link no encontrado o ya eliminado');

    const mediaFileId = deletedLink.media_file_id;

    // 3. Verificar si quedan otros links al mismo archivo
    const { data: remainingLinks, error: checkLinksError } = await supabase
      .from('media_links')
      .select('id')
      .eq('media_file_id', mediaFileId)
      .limit(1);

    if (checkLinksError) throw checkLinksError;

    // 4. Si no quedan links, eliminar el archivo físico
    if (!remainingLinks || remainingLinks.length === 0) {
      // Obtener datos del archivo
      const { data: fileData, error: fileFetchError } = await supabase
        .from('media_files')
        .select('file_path, bucket, is_deleted')
        .eq('id', mediaFileId)
        .single();

      if (fileFetchError) throw fileFetchError;

      // Solo proceder si el archivo no está ya eliminado
      if (fileData && !fileData.is_deleted) {
        // Soft delete en media_files
        const { error: softDeleteError } = await supabase
          .from('media_files')
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString() 
          })
          .eq('id', mediaFileId);

        if (softDeleteError) throw softDeleteError;

        // Eliminar del storage
        const { error: storageError } = await supabase.storage
          .from(fileData.bucket)
          .remove([fileData.file_path]);

        if (storageError) {
          console.error('Error eliminando del storage:', storageError);
          // No lanzar error aquí - el soft delete ya se hizo
        }
      }
    }

  } catch (error) {
    console.error('Error deleting media file V2:', error);
    throw error;
  }
}

/**
 * Elimina múltiples links de archivos en una sola operación.
 * Útil para limpiezas masivas o eliminación de entidades que tienen múltiples archivos.
 * 
 * @param linkIds - Array de IDs de media_links a eliminar
 * @returns void
 */
export async function deleteMultipleMediaFilesV2(linkIds: string[]): Promise<void> {
  if (!supabase || !linkIds || linkIds.length === 0) {
    return;
  }

  // Procesar eliminaciones en paralelo
  await Promise.all(
    linkIds.map(linkId => deleteMediaFileV2(linkId))
  );
}
