import type { Contact, ContactWithRelations, ContactAttachment } from '../types';
import { getPublicUrl } from '@/lib/supabase/storage';

/**
 * Formatea el nombre de un contacto con lógica de fallback.
 * 
 * Prioridad:
 * 1. display_name_override
 * 2. first_name + last_name
 * 3. full_name
 * 4. company_name
 * 5. 'Cliente' (fallback)
 * 
 * @param contact - Objeto contacto con campos de nombre
 * @returns Nombre formateado del contacto
 */
export function formatContactName(contact: {
  company_name?: string | null;
  display_name_override?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
} | null | undefined): string {
  if (!contact) return 'Cliente';
  
  if (contact.display_name_override?.trim()) {
    return contact.display_name_override.trim();
  }
  
  const firstName = contact.first_name?.trim() || '';
  const lastName = contact.last_name?.trim() || '';
  
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  if (contact.full_name?.trim()) {
    return contact.full_name.trim();
  }
  
  if (contact.company_name?.trim()) {
    return contact.company_name.trim();
  }
  
  return 'Cliente';
}

/**
 * Obtiene la URL pública de un adjunto de contacto.
 * 
 * @param attachment - Objeto de adjunto con bucket y path (solo requiere storage_bucket y storage_path)
 * @returns URL pública del archivo
 */
export function getAttachmentPublicUrl(attachment: Pick<ContactAttachment, 'storage_bucket' | 'storage_path'>): string {
  return getPublicUrl(attachment.storage_bucket, attachment.storage_path);
}

/**
 * Agrupa contactos por la primera letra de su nombre.
 * 
 * @param contacts - Array de contactos
 * @returns Objeto con contactos agrupados por letra
 */
export function groupContactsByLetter(
  contacts: ContactWithRelations[]
): Record<string, ContactWithRelations[]> {
  const groups: Record<string, ContactWithRelations[]> = {};
  
  contacts.forEach(contact => {
    const displayName = formatContactName(contact);
    const firstLetter = displayName.charAt(0).toUpperCase();
    
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(contact);
  });
  
  const sortedGroups: Record<string, ContactWithRelations[]> = {};
  Object.keys(groups).sort().forEach(letter => {
    sortedGroups[letter] = groups[letter];
  });
  
  return sortedGroups;
}

/**
 * Slugifica un nombre de archivo para storage.
 * 
 * @param name - Nombre original del archivo
 * @returns Nombre slugificado
 */
export function slugifyFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
