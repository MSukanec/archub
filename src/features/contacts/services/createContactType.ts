import { supabase } from '@/lib/supabase';
import type { ContactTypeInput, ContactType } from '../types';

/**
 * Crea un nuevo tipo de contacto en la organización.
 * 
 * @param organizationId - ID de la organización
 * @param input - Datos del tipo de contacto
 * @returns Tipo de contacto creado
 * @throws {Error} Si falla la creación
 */
export async function createContactType(
  organizationId: string,
  input: ContactTypeInput
): Promise<ContactType> {
  if (!supabase || !organizationId) {
    throw new Error('Missing required parameters');
  }

  const { data, error } = await supabase
    .from('contact_types')
    .insert({
      organization_id: organizationId,
      name: input.name,
      is_deleted: false,
      deleted_at: null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
