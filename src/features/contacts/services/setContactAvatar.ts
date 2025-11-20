import { supabase } from '@/lib/supabase';

/**
 * Establece el avatar de un contacto usando un adjunto existente.
 * 
 * @param contactId - ID del contacto
 * @param attachmentId - ID del adjunto a usar como avatar
 * @throws {Error} Si falla la actualización
 */
export async function setContactAvatar(
  contactId: string,
  attachmentId: string
): Promise<void> {
  if (!supabase || !contactId || !attachmentId) {
    throw new Error('Missing required parameters');
  }

  const { error } = await supabase
    .from('contacts')
    .update({
      avatar_attachment_id: attachmentId,
      avatar_updated_at: new Date().toISOString(),
    })
    .eq('id', contactId);

  if (error) {
    throw new Error(`Error al actualizar avatar: ${error.message}`);
  }
}
