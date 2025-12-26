/**
 * Project Types
 * 
 * All TypeScript interfaces and types for the projects feature.
 */

export interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
  created_by: string;
  organization_id: string;
  is_active: boolean;
  color?: string;
  use_custom_color?: boolean;
  custom_color_h?: number | null;
  custom_color_hex?: string | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  last_active_at?: string | null;
  updated_at?: string;
  currency_id?: string | null;
  currency?: { id: string; name: string; symbol: string } | null;
  project_data?: ProjectData;
  creator?: ProjectCreator;
}

export interface ProjectData {
  project_type_id?: string;
  project_modality_id?: string;
  image_bucket?: string;
  image_path?: string;
  city?: string;
  country?: string;
  start_date?: string;
  estimated_end?: string;
  project_type?: {
    id: string;
    name: string;
  };
  project_modality?: {
    id: string;
    name: string;
  };
}

export interface ProjectCreator {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string;
}

export interface ProjectLite {
  id: string;
  name: string;
  color: string | null;
  status: string;
  updated_at: string;
}

export interface CreateProjectData {
  organization_id: string;
  name: string;
  status: 'active' | 'inactive' | 'completed' | 'paused';
  created_by: string;
  color?: string;
  use_custom_color?: boolean;
  custom_color_h?: number | null;
  custom_color_hex?: string | null;
  project_type_id?: string | null;
  project_modality_id?: string | null;
  currency_id?: string | null;
}

export interface UpdateProjectData {
  name?: string;
  status?: 'active' | 'inactive' | 'completed' | 'paused';
  color?: string;
  use_custom_color?: boolean;
  custom_color_h?: number | null;
  custom_color_hex?: string | null;
  project_type_id?: string | null;
  project_modality_id?: string | null;
  currency_id?: string | null;
  organization_id: string;
}

export interface ProjectStats {
  project: Project & {
    project_data: {
      image_bucket?: string;
      image_path?: string;
    } | null;
  };
  totalDocuments: number;
  totalSiteLogs: number;
  totalBudgets: number;
  totalMovements: number;
}

export interface ProjectActivityData {
  date: string;
  documents: number;
  siteLogs: number;
  movements: number;
}

export interface UploadedProjectImage {
  file_url: string;
  file_path: string;
}

export interface ProjectModality {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  organization_id: string | null;
  updated_at: string;
  created_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
}

export interface ProjectType {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  organization_id: string | null;
  updated_at: string;
  created_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
}
