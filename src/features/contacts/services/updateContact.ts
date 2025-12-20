import { supabase } from '@/lib/supabase';
import type { ContactInput, Contact } from '../types';

/**
 * Actualiza un contacto existente.
 * 
 * @param contactId - ID del contacto a actualizar
 * @param organizationId - ID de la organización
 * @param input - Datos actualizados del contacto
 * @returns Contacto actualizado
 * @throws {Error} Si falla la actualización
 */
export async function updateContact(
  contactId: string,
  organizationId: string,
  input: Partial<ContactInput>
): Promise<Contact> {
  if (!supabase || !contactId || !organizationId) {
    throw new Error('Missing required parameters');
  }

  // Generate full_name by concatenating first_name and last_name if they're provided
  let full_name: string | null | undefined = undefined;
  if (input.first_name !== undefined || input.last_name !== undefined) {
    const firstName = input.first_name || '';
    const lastName = input.last_name || '';
    full_name = [firstName, lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || null;
  }

  const updateData: any = {
    first_name: input.first_name,
    last_name: input.last_name || null,
    email: input.email || null,
    phone: input.phone || null,
    company_name: input.company_name || null,
    location: input.location || null,
    notes: input.notes || null,
    linked_user_id: input.linked_user_id || null,
    national_id: input.national_id || null,
    display_name_override: input.display_name_override || null,
    updated_at: new Date().toISOString(),
  };

  // Only update full_name if it was calculated
  if (full_name !== undefined) {
    updateData.full_name = full_name;
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(updateData)
    .eq('id', contactId)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
