import type { Contact, ContactWithRelations, ContactType, ContactAttachment } from '../types';

/**
 * Mapea un contacto con sus relaciones (tipos, usuario vinculado, adjuntos).
 * 
 * @param contact - Contacto base
 * @param contactTypes - Tipos de contacto relacionados
 * @param linkedUser - Usuario vinculado (opcional)
 * @param attachments - Adjuntos del contacto (opcional)
 * @returns Contacto con relaciones mapeadas
 */
export function mapContactWithRelations(
  contact: Contact,
  contactTypes?: ContactType[],
  linkedUser?: any,
  attachments?: ContactAttachment[]
): ContactWithRelations {
  return {
    ...contact,
    contact_types: contactTypes || [],
    linked_user: linkedUser || null,
    attachments: attachments || [],
    attachments_count: attachments?.length || 0,
  };
}

/**
 * Filtra contactos no eliminados (soft delete).
 * 
 * @param contacts - Array de contactos
 * @returns Contactos no eliminados
 */
export function filterActiveContacts<T extends Contact>(contacts: T[]): T[] {
  return contacts.filter(contact => !contact.is_deleted);
}

/**
 * Filtra tipos de contacto no eliminados (soft delete).
 * 
 * @param contactTypes - Array de tipos de contacto
 * @returns Tipos no eliminados
 */
export function filterActiveContactTypes(contactTypes: ContactType[]): ContactType[] {
  return contactTypes.filter(type => !type.is_deleted);
}
