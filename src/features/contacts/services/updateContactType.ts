import { supabase } from '@/lib/supabase';
import type { ContactTypeInput, ContactType } from '../types';

/**
 * Actualiza un tipo de contacto existente.
 * 
 * @param typeId - ID del tipo de contacto
 * @param organizationId - ID de la organización
 * @param input - Datos actualizados
 * @returns Tipo de contacto actualizado
 * @throws {Error} Si falla la actualización
 */
export async function updateContactType(
  typeId: string,
  organizationId: string,
  input: ContactTypeInput
): Promise<ContactType> {
  if (!supabase || !typeId || !organizationId) {
    throw new Error('Missing required parameters');
  }

  const { data, error } = await supabase
    .from('contact_types')
    .update({
      name: input.name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', typeId)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
