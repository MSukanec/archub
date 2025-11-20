import { supabase } from '@/lib/supabase';
import { removeFromBucket } from '@/lib/supabase/storage';

/**
 * Elimina un adjunto de un contacto.
 * 
 * Proceso:
 * 1. Obtiene información del adjunto
 * 2. Elimina el archivo del storage
 * 3. Elimina el registro de la base de datos
 * 
 * @param attachmentId - ID del adjunto a eliminar
 * @throws {Error} Si falla la eliminación
 */
export async function deleteContactAttachment(
  attachmentId: string
): Promise<void> {
  if (!supabase || !attachmentId) {
    throw new Error('Missing required parameters');
  }

  const { data: attachment, error: fetchError } = await supabase
    .from('contact_attachments')
    .select('*')
    .eq('id', attachmentId)
    .single();

  if (fetchError) {
    throw new Error(`Error al obtener adjunto: ${fetchError.message}`);
  }

  if (!attachment) {
    throw new Error('Adjunto no encontrado');
  }

  try {
    await removeFromBucket(attachment.storage_bucket, [attachment.storage_path]);

    const { error: deleteError } = await supabase
      .from('contact_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      throw new Error(`Error al eliminar adjunto: ${deleteError.message}`);
    }
  } catch (error) {
    throw error;
  }
}
