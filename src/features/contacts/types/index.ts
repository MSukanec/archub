/**
 * Tipos para el feature CONTACTS
 * 
 * Alineados con las vistas SQL de Supabase:
 * - contacts_with_relations_view
 * - contacts_by_type_view
 * - contacts_summary_view
 */

export interface Contact {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  location: string | null;
  notes: string | null;
  national_id: string | null;
  linked_user_id: string | null;
  image_bucket: string | null;
  image_path: string | null;
  avatar_updated_at: string | null;
  is_local: boolean | null;
  display_name_override: string | null;
  linked_at: string | null;
  sync_status: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ContactType {
  id: string;
  name: string;
  organization_id: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string;
}

export interface ContactTypeLink {
  id: string;
  contact_id: string | null;
  contact_type_id: string | null;
  organization_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ContactAttachment {
  id: string;
  contact_id: string;
  organization_id: string | null;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  category: 'dni_front' | 'dni_back' | 'document' | 'photo' | 'other';
  metadata: any;
  created_by: string | null;
  created_at: string;
}

export interface LinkedUser {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
}

/**
 * ContactWithRelations - Tipo que refleja la vista contacts_with_relations_view
 * 
 * Esta vista ya hace todos los JOINs necesarios:
 * - linked_user (datos del usuario vinculado)
 * - contact_types (array JSON de tipos)
 * - is_organization_member (si es miembro de la org)
 */
export interface ContactWithRelations extends Contact {
  linked_user_full_name: string | null;
  linked_user_email: string | null;
  linked_user_avatar_url: string | null;
  contact_types: ContactTypeSimple[];
  is_organization_member: boolean;
  attachments?: ContactAttachment[];
  attachments_count?: number;
  /** Objeto linked_user construido para retrocompatibilidad con UI existente */
  linked_user?: LinkedUser | null;
}

/** Tipo simplificado para tipos de contacto (del JSON de la vista) */
export interface ContactTypeSimple {
  id: string;
  name: string;
}

/**
 * ContactByType - Tipo que refleja la vista contacts_by_type_view
 */
export interface ContactByType {
  organization_id: string;
  contact_type_id: string;
  contact_type_name: string;
  total_contacts: number;
}

/**
 * ContactsSummary - Tipo que refleja la vista contacts_summary_view
 */
export interface ContactsSummary {
  organization_id: string;
  total_contacts: number;
  linked_contacts: number;
  member_contacts: number;
}

export interface ContactInput {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  location?: string;
  notes?: string;
  linked_user_id?: string;
  national_id?: string;
  display_name_override?: string;
}

export interface ContactTypeInput {
  name: string;
}

export interface ContactAttachmentInput {
  file: File;
  category: 'dni_front' | 'dni_back' | 'document' | 'photo' | 'other';
  metadata?: any;
}
