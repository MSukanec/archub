import { supabase } from '@/lib/supabase';
import type { ContactAttachment } from '../types';

/**
 * Lista todos los adjuntos de un contacto.
 * 
 * @param contactId - ID del contacto
 * @returns Array de adjuntos, o array vacío si no hay datos
 * @throws {Error} Si falla la query
 */
export async function listContactAttachments(
  contactId: string
): Promise<ContactAttachment[]> {
  if (!supabase || !contactId) {
    return [];
  }

  const { data, error } = await supabase
    .from('contact_attachments')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
