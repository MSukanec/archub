/**
 * Media Feature - TypeScript Types
 * 
 * All type definitions for the media module
 */

export type MediaVisibility = 'organization' | 'project' | 'private';

export type MediaFileType = 'image' | 'video' | 'pdf' | 'doc' | 'other';

export type MediaCategory = 
  | 'dni_front' 
  | 'dni_back' 
  | 'document' 
  | 'photo' 
  | 'other'
  | 'general'
  | 'technical'
  | 'financial'
  | 'legal'
  | 'course_cover'
  | 'instructor_photo'
  | 'module_image'
  | 'section_background'
  | 'testimonial_logo'
  | 'project_photo'
  | 'og_image'
  | 'client_gallery'
  | 'forum_attachment'
  | 'inspiration_pin';

/**
 * Registro en tabla media_files (archivo físico centralizado)
 */
export interface MediaFileRecord {
  id: string;
  organization_id: string | null;
  created_by: string | null;
  bucket: string;
  file_path: string;
  file_name: string | null;
  file_url: string;
  file_type: MediaFileType;
  file_size: number | null;
  is_public: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
}

/**
 * Registro en tabla media_links (relación con entidades)
 */
export interface MediaLinkRecord {
  id: string;
  media_file_id: string;
  organization_id: string | null;
  project_id: string | null;
  site_log_id: string | null;
  movement_id: string | null;
  contact_id: string | null;
  course_lesson_id: string | null;
  general_cost_payment_id: string | null;
  client_payment_id: string | null;
  course_id: string | null;
  course_module_id: string | null;
  created_by: string | null;
  created_at: string;
  visibility: string | null;
  description: string | null;
  category: string | null;
  is_cover: boolean;
  position: number | null;
  metadata: Record<string, any>;
}

/**
 * Archivo completo con datos del file + link (JOIN)
 */
export interface MediaFileWithLink {
  // Datos del archivo físico (media_files)
  id: string;
  file_url: string;
  file_name: string;
  file_type: MediaFileType;
  file_size: number | null;
  file_path: string;
  bucket: string;
  is_deleted: boolean;
  
  // Datos del link (media_links)
  link_id: string;
  project_id: string | null;
  project_name?: string;
  site_log_id: string | null;
  movement_id?: string | null;
  contact_id?: string | null;
  course_lesson_id?: string | null;
  general_cost_payment_id?: string | null;
  client_payment_id?: string | null;
  course_id?: string | null;
  course_module_id?: string | null;
  organization_id: string | null;
  visibility: MediaVisibility | 'public' | null;
  description: string | null;
  category: MediaCategory | null;
  is_cover: boolean;
  position: number | null;
  created_at: string;
  created_by: string | null;
}

// ============================================
// TIPOS LEGACY (mantener compatibilidad)
// ============================================

/**
 * @deprecated Usar MediaFileWithLink en su lugar
 */
export interface MediaFile {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  created_at: string;
  project_id: string;
  organization_id: string;
  visibility: MediaVisibility;
  created_by: string;
  description?: string;
  file_path: string;
}

/**
 * @deprecated Usar MediaFileWithLink en su lugar
 */
export interface GalleryFile extends MediaFile {
  project_name?: string;
  site_log_id?: string | null;
}

/**
 * @deprecated Usar MediaFileWithLink en su lugar
 */
export interface DocumentFile extends MediaFile {
  project_name?: string;
  folder_path?: string;
  tags?: string[];
}

// ============================================
// INPUTS
// ============================================

export interface MediaFileInput {
  file: File;
  project_id: string;
  organization_id: string;
  visibility: MediaVisibility;
  description?: string;
  created_by: string;
}

export interface UploadMediaResult {
  id: string;
  file_url: string;
  file_path: string;
}

/**
 * Input para subir archivo usando nueva arquitectura (media_files + media_links)
 */
export interface UploadMediaInputV2 {
  file: File;
  organization_id?: string | null;
  created_by?: string | null;
  
  // Bucket de destino (por defecto 'media')
  bucket?: string;
  
  // Relación con entidades (al menos una debe estar presente)
  project_id?: string;
  site_log_id?: string;
  movement_id?: string;
  contact_id?: string;
  course_lesson_id?: string;
  general_cost_id?: string;
  client_payment_id?: string;
  course_id?: string;
  course_module_id?: string;
  
  // Metadata del link
  visibility?: MediaVisibility | 'public';
  description?: string;
  category?: MediaCategory;
  is_cover?: boolean;
  position?: number;
  metadata?: Record<string, any>;
}

/**
 * Resultado de subir archivo usando nueva arquitectura
 */
export interface UploadMediaResultV2 {
  media_file_id: string;
  link_id: string;
  file_url: string;
  file_path: string;
}
