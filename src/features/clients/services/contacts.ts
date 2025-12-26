import { supabase } from '@/lib/supabase';
import type { Contact } from '../types';

/**
 * Obtiene todos los contactos de una organización.
 * 
 * Nota: Este servicio es de solo lectura. Los contactos son gestionados
 * desde el módulo de contactos de la organización.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de contactos, o array vacío si no hay datos
 * @throws {Error} Si falla la query de Supabase
 */
export async function getContacts(
  organizationId: string
): Promise<Contact[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Obtiene un contacto específico por su ID.
 * 
 * Nota: Este servicio es de solo lectura. Los contactos son gestionados
 * desde el módulo de contactos de la organización.
 * 
 * @param contactId - ID del contacto
 * @param organizationId - ID de la organización
 * @returns Contacto, o null si no existe
 * @throws {Error} Si falla la query de Supabase
 */
export async function getContactById(
  contactId: string,
  organizationId: string
): Promise<Contact | null> {
  if (!supabase || !organizationId || !contactId) {
    return null;
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
