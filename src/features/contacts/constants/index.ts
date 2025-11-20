export const CONTACT_QUERY_KEYS = {
  all: ['contacts'] as const,
  lists: () => [...CONTACT_QUERY_KEYS.all, 'list'] as const,
  list: (organizationId: string) => [...CONTACT_QUERY_KEYS.lists(), organizationId] as const,
  details: () => [...CONTACT_QUERY_KEYS.all, 'detail'] as const,
  detail: (organizationId: string, contactId: string) => [...CONTACT_QUERY_KEYS.details(), organizationId, contactId] as const,
} as const;

export const CONTACT_TYPE_QUERY_KEYS = {
  all: ['contact-types'] as const,
  lists: () => [...CONTACT_TYPE_QUERY_KEYS.all, 'list'] as const,
  list: (organizationId: string) => [...CONTACT_TYPE_QUERY_KEYS.lists(), organizationId] as const,
} as const;

export const CONTACT_ATTACHMENT_QUERY_KEYS = {
  all: ['contact-attachments'] as const,
  lists: () => [...CONTACT_ATTACHMENT_QUERY_KEYS.all, 'list'] as const,
  list: (contactId: string) => [...CONTACT_ATTACHMENT_QUERY_KEYS.lists(), contactId] as const,
} as const;

export const ATTACHMENT_CATEGORIES = {
  dni_front: { value: 'dni_front', label: 'DNI (Frente)' },
  dni_back: { value: 'dni_back', label: 'DNI (Dorso)' },
  document: { value: 'document', label: 'Documento' },
  photo: { value: 'photo', label: 'Foto' },
  other: { value: 'other', label: 'Otro' },
} as const;

export const ATTACHMENT_CATEGORY_OPTIONS = Object.values(ATTACHMENT_CATEGORIES);

export const CONTACT_STORAGE_BUCKET = 'contact-files' as const;
