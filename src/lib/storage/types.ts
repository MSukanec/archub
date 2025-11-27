export type EntityType = 
  | 'user_avatar'
  | 'org_logo' 
  | 'course_cover_public'
  | 'course_module_image'
  | 'ui_asset'
  | 'invoice'
  | 'budget'
  | 'contract'
  | 'permit'
  | 'technical_plan'
  | 'contact_avatar'
  | 'contact_document'
  | 'general_cost_payment_attachment'
  | 'client_payment_attachment'
  | 'material_payment_attachment'
  | 'sitelog_attachment'
  | 'project_photo'
  | 'sitelog_photo'
  | 'project_document';

export type BucketName = 'public-assets' | 'private-assets' | 'social-assets';

export interface UploadContext {
  entity: EntityType;
  organization_id?: string;
  user_id?: string;
  project_id?: string;
  course_id?: string;
  created_by_member_id?: string;
  link_to?: {
    project_id?: string;
    contact_id?: string;
    general_cost_id?: string;
    general_cost_payment_id?: string;
    sitelog_id?: string;
    course_id?: string;
    course_module_id?: string;
    course_lesson_id?: string;
    movement_id?: string;
    client_payment_id?: string;
    material_payment_id?: string;
  };
  category?: string;
  description?: string;
  is_cover?: boolean;
  position?: number;
  metadata?: Record<string, any>;
}

export interface UploadResult {
  media_file_id: string;
  media_link_id?: string;
  file_url: string | null;
  file_path: string;
  bucket: BucketName;
  compressionStats?: {
    originalSize: number;
    compressedSize: number;
    wasCompressed: boolean;
  };
}

export interface StoragePath {
  bucket: BucketName;
  path: string;
  fullPath: string;
}
