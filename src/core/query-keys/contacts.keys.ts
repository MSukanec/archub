/**
 * Centralized Query Keys for Contacts Feature
 * 
 * ARQUITECTURA ENTERPRISE DE CACHE
 * ================================
 * 
 * Una entidad = una familia única y centralizada de query keys
 * Las mutaciones actualizan el cache directamente, no dependen de invalidaciones sueltas
 * 
 * REGLAS ESTRICTAS:
 * 1. TODAS las queries de contacts DEBEN usar estas keys
 * 2. PROHIBIDO crear query keys inline en componentes
 * 3. PROHIBIDO keys paralelas
 * 4. Las mutaciones DEBEN usar queryClient.setQueryData() para actualizar cache
 * 5. Cero invalidaciones masivas
 * 
 * @example
 * // En queries:
 * useQuery({ queryKey: contactsKeys.list(organizationId) })
 * useQuery({ queryKey: contactsKeys.detail(organizationId, contactId) })
 * 
 * @example
 * // En mutaciones:
 * onSuccess(updatedContact) {
 *   queryClient.setQueryData(contactsKeys.detail(orgId, contactId), updatedContact)
 *   queryClient.setQueryData(contactsKeys.list(orgId), (old) => 
 *     old?.map(c => c.id === contactId ? updatedContact : c)
 *   )
 * }
 */

/** Type alias para IDs que pueden ser null o undefined */
type NullableId = string | null | undefined;

export const contactsKeys = {
  /** Base key para todos los datos de contacts */
  all: ['contacts'] as const,

  // ═══════════════════════════════════════════════════════════════
  // LISTAS DE CONTACTOS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para todas las listas */
  lists: () => [...contactsKeys.all, 'list'] as const,
  
  /** Lista de contactos por organización (FUENTE ÚNICA DE VERDAD) */
  list: (organizationId: NullableId) => 
    [...contactsKeys.lists(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // DETALLES DE CONTACTO INDIVIDUAL
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para todos los detalles */
  details: () => [...contactsKeys.all, 'detail'] as const,
  
  /** Detalle completo de un contacto */
  detail: (organizationId: NullableId, contactId: NullableId) => 
    [...contactsKeys.details(), organizationId ?? undefined, contactId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // ADJUNTOS DE CONTACTO
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para todos los adjuntos */
  attachments: () => [...contactsKeys.all, 'attachments'] as const,
  
  /** Lista de adjuntos por contacto y organización */
  attachmentList: (organizationId: NullableId, contactId: NullableId) => 
    [...contactsKeys.attachments(), organizationId ?? undefined, contactId ?? undefined] as const,
} as const;

export const contactTypesKeys = {
  /** Base key para todos los tipos de contacto */
  all: ['contact-types'] as const,

  // ═══════════════════════════════════════════════════════════════
  // LISTAS DE TIPOS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para todas las listas */
  lists: () => [...contactTypesKeys.all, 'list'] as const,
  
  /** Lista de tipos por organización */
  list: (organizationId: NullableId) => 
    [...contactTypesKeys.lists(), organizationId ?? undefined] as const,
} as const;

/** Tipo de las query keys de contacts */
export type ContactsQueryKey = readonly (string | undefined)[];
export type ContactTypesQueryKey = readonly (string | undefined)[];
