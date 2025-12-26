/**
 * Media Feature - Constants
 * 
 * All constant values, configurations, and options for the media module
 */
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const SPREADSHEET_TYPES = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
export const FILE_TYPES = {
  IMAGE: IMAGE_TYPES,
  VIDEO: VIDEO_TYPES,
  DOCUMENT: DOCUMENT_TYPES,
  SPREADSHEET: SPREADSHEET_TYPES,
  ALL: [...IMAGE_TYPES, ...VIDEO_TYPES, ...DOCUMENT_TYPES, ...SPREADSHEET_TYPES]
} as const;
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const VISIBILITY_OPTIONS = [
  { value: 'organization', label: 'Organización'},
  { value: 'project', label: 'Proyecto'},
  { value: 'private', label: 'Privado'}
] as const;
export const QUERY_KEYS = {
  GALLERY_FILES: 'gallery-files',
  DOCUMENT_FILES: 'document-files',
  CURRENT_PROJECT: 'current-project',
  MEDIA_FILE: 'media-file'
} as const;
export const STORAGE_BUCKETS = {
  MEDIA: 'media',
  DESIGN_DOCUMENTS: 'design-documents'
} as const;
