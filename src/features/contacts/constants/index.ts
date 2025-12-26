/**
 * Query keys migrated to @/core/query-keys/contacts.keys.ts
 * Import from: import { contactsKeys, contactTypesKeys } from '@/core/query-keys'
 * 
 * @deprecated Use contactsKeys and contactTypesKeys from @/core/query-keys
 */
export { contactsKeys as CONTACT_QUERY_KEYS, contactTypesKeys as CONTACT_TYPE_QUERY_KEYS } from '@/core/query-keys';

export const ATTACHMENT_CATEGORIES = {
  dni_front: { value: 'dni_front', label: 'DNI (Frente)' },
  dni_back: { value: 'dni_back', label: 'DNI (Dorso)' },
  document: { value: 'document', label: 'Documento' },
  photo: { value: 'photo', label: 'Foto' },
  other: { value: 'other', label: 'Otro' },
} as const;

export const ATTACHMENT_CATEGORY_OPTIONS = Object.values(ATTACHMENT_CATEGORIES);

export const CONTACT_STORAGE_BUCKET = 'contact-files' as const;
