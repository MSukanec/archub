import type { EntityType, BucketName } from './types';
import type { ImagePreset } from '@/lib/imageCompression';

interface EntityConfig {
  bucket: BucketName;
  basePath: string;
  compressionPreset: ImagePreset;
  visibility: 'public' | 'organization' | 'private';
}

export const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
  'user_avatar': {
    bucket: 'public-assets',
    basePath: 'users/{user_id}/avatars',
    compressionPreset: 'avatar',
    visibility: 'public'
  },
  'org_logo': {
    bucket: 'public-assets',
    basePath: 'organizations/{org_id}/branding',
    compressionPreset: 'avatar',
    visibility: 'public'
  },
  'course_cover_public': {
    bucket: 'public-assets',
    basePath: 'marketplace/courses',
    compressionPreset: 'course-cover',
    visibility: 'public'
  },
  'course_module_image': {
    bucket: 'public-assets',
    basePath: 'marketplace/courses/{course_id}/module-images',
    compressionPreset: 'course-cover',
    visibility: 'public'
  },
  'course_client_gallery': {
    bucket: 'public-assets',
    basePath: 'marketplace/courses/{course_id}/client-gallery',
    compressionPreset: 'project-cover',
    visibility: 'public'
  },
  'ui_asset': {
    bucket: 'public-assets',
    basePath: 'app-ui',
    compressionPreset: 'default',
    visibility: 'public'
  },
  'invoice': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/finance/invoices',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'budget': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/finance/budgets',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'contract': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/legal/contracts',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'permit': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/legal/permits',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'technical_plan': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/technical/plans',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'contact_avatar': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/contacts/avatars',
    compressionPreset: 'avatar',
    visibility: 'organization'
  },
  'contact_document': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/contacts/documents',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'general_cost_payment_attachment': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/finance/general-costs/attachments',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'client_payment_attachment': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/finance/client-payments',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'material_payment_attachment': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/finance/material-payments',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'material_purchase_attachment': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/finance/material-purchases',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'personnel_payment_attachment': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/finance/personnel-payments',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'partner_contribution_attachment': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/finance/partner-contributions',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'partner_withdrawal_attachment': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/finance/partner-withdrawals',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'sitelog_attachment': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/sitelogs/{project_id}',
    compressionPreset: 'sitelog-photo',
    visibility: 'organization'
  },
  'project_photo': {
    bucket: 'social-assets',
    basePath: 'projects/{org_id}/{project_id}/gallery',
    compressionPreset: 'project-cover',
    visibility: 'organization'
  },
  'sitelog_photo': {
    bucket: 'social-assets',
    basePath: 'projects/{org_id}/{project_id}/updates',
    compressionPreset: 'sitelog-photo',
    visibility: 'organization'
  },
  'project_document': {
    bucket: 'social-assets',
    basePath: 'projects/{org_id}/{project_id}/documents',
    compressionPreset: 'document',
    visibility: 'organization'
  },
  'course_purchase_receipt': {
    bucket: 'private-assets',
    basePath: 'marketplace/receipts/{course_id}/{user_id}',
    compressionPreset: 'document',
    visibility: 'private'
  },
  'testimonial_avatar': {
    bucket: 'public-assets',
    basePath: 'marketplace/testimonials',
    compressionPreset: 'avatar',
    visibility: 'public'
  },
  'hero_section_media': {
    bucket: 'public-assets',
    basePath: 'app-ui/hero-sections',
    compressionPreset: 'course-cover',
    visibility: 'public'
  },
  'forum_thread_attachment': {
    bucket: 'social-assets',
    basePath: 'forum/{org_id}/threads',
    compressionPreset: 'sitelog-photo',
    visibility: 'organization'
  },
  'inspiration_pin': {
    bucket: 'private-assets',
    basePath: 'organizations/{org_id}/moodboard/pins',
    compressionPreset: 'sitelog-photo',
    visibility: 'organization'
  }
};

export function getEntityConfig(entity: EntityType): EntityConfig {
  const config = ENTITY_CONFIG[entity];
  if (!config) {
    throw new Error(`Unknown entity type: ${entity}`);
  }
  return config;
}

export function getBucketForEntity(entity: EntityType): BucketName {
  return getEntityConfig(entity).bucket;
}

export function getCompressionPreset(entity: EntityType): ImagePreset {
  return getEntityConfig(entity).compressionPreset;
}

export function getVisibility(entity: EntityType): 'public' | 'organization' | 'private' {
  return getEntityConfig(entity).visibility;
}
