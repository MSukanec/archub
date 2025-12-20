import { supabase } from '@/lib/supabase';
import type { ContactInput, Contact } from '../types';

/**
 * Crea un nuevo contacto en la organización.
 * 
 * @param organizationId - ID de la organización
 * @param input - Datos del contacto a crear
 * @returns Contacto creado
 * @throws {Error} Si falla la creación del contacto
 */
export async function createContact(
  organizationId: string,
  input: ContactInput
): Promise<Contact> {
  if (!supabase || !organizationId) {
    throw new Error('Missing required parameters');
  }

  // Generate full_name by concatenating first_name and last_name
  const full_name = [input.first_name, input.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || null;

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      organization_id: organizationId,
      first_name: input.first_name,
      last_name: input.last_name || null,
      full_name: full_name,
      email: input.email || null,
      phone: input.phone || null,
      company_name: input.company_name || null,
      location: input.location || null,
      notes: input.notes || null,
      linked_user_id: input.linked_user_id || null,
      national_id: input.national_id || null,
      display_name_override: input.display_name_override || null,
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
