/**
 * Media Feature - TypeScript Types
 * 
 * All type definitions for the media module
 */

export type MediaVisibility = 'organization' | 'project' | 'private';

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

export interface GalleryFile extends MediaFile {
  project_name?: string;
  site_log_id?: string | null;
}

export interface DocumentFile extends MediaFile {
  project_name?: string;
  folder_path?: string;
  tags?: string[];
}

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
