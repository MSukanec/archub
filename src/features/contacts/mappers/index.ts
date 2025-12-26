import type { ContactWithRelations, ContactType, ContactAttachment, LinkedUser } from '../types';
/**
 * Transforma los datos de contacts_with_relations_view al formato del frontend.
 * Construye el objeto `linked_user` a partir de los campos planos de la vista.
 * 
 * @param viewData - Datos de la vista contacts_with_relations_view
 * @returns ContactWithRelations con linked_user como objeto
 */
export function mapViewToContact(viewData: ContactWithRelations): ContactWithRelations {
  const linkedUser: LinkedUser | null = viewData.linked_user_id 
    ? {
        id: viewData.linked_user_id,
        full_name: viewData.linked_user_full_name,
        email: viewData.linked_user_email,
        avatar_url: viewData.linked_user_avatar_url,
      }
    : null;
  return {
    ...viewData,
    linked_user: linkedUser,
  };
}
/**
 * Transforma un array de datos de la vista al formato del frontend.
 * 
 * @param viewDataArray - Array de datos de la vista
 * @returns Array de ContactWithRelations con linked_user como objeto
 */
export function mapViewToContacts(viewDataArray: ContactWithRelations[]): ContactWithRelations[] {
  return viewDataArray.map(mapViewToContact);
}
/**
 * Filtra contactos no eliminados (soft delete).
 * 
 * @param contacts - Array de contactos
 * @returns Contactos no eliminados
 */
export function filterActiveContacts<T extends { is_deleted: boolean }>(contacts: T[]): T[] {
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
