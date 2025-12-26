export type EntityType = 
  | 'user_avatar'
  | 'org_logo'
  | 'course_cover_public'
  | 'course_module_image'
  | 'course_client_gallery'
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
  | 'material_purchase_attachment'
  | 'personnel_payment_attachment'
  | 'partner_contribution_attachment'
  | 'partner_withdrawal_attachment'
  | 'sitelog_attachment'
  | 'project_photo'
  | 'sitelog_photo'
  | 'project_document'
  | 'course_purchase_receipt'
  | 'testimonial_avatar'
  | 'hero_section_media'
  | 'forum_thread_attachment'
  | 'inspiration_pin';
export type BucketName = 'public-assets'| 'private-assets'| 'social-assets';
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
    client_payment_id?: string;
    material_payment_id?: string;
    material_purchase_id?: string;
    personnel_payment_id?: string;
    partner_contribution_id?: string;
    partner_withdrawal_id?: string;
    testimonial_id?: string;
    hero_section_id?: string;
    forum_thread_id?: string;
    pin_id?: string;
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
