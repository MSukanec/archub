import { uploadFile } from './uploadFile';
import type { UploadContext, UploadResult } from './types';

export async function uploadContactDocument(
  file: File,
  contactId: string,
  organizationId: string,
  category: string = 'document'
): Promise<UploadResult> {
  const context: UploadContext = {
    entity: 'contact_document',
    organization_id: organizationId,
    link_to: {
      contact_id: contactId
    },
    category,
    description: `Contact ${category}`
  };

  return uploadFile(file, context);
}

export async function uploadSitelogPhoto(
  file: File,
  projectId: string,
  organizationId: string,
  sitelogId: string
): Promise<UploadResult> {
  const context: UploadContext = {
    entity: 'sitelog_photo',
    organization_id: organizationId,
    project_id: projectId,
    link_to: {
      project_id: projectId,
      sitelog_id: sitelogId
    },
    category: 'sitelog_photo',
    description: 'Site log photo'
  };

  return uploadFile(file, context);
}

export async function uploadProjectDocument(
  file: File,
  projectId: string,
  organizationId: string,
  category: string = 'document'
): Promise<UploadResult> {
  const context: UploadContext = {
    entity: 'project_document',
    organization_id: organizationId,
    project_id: projectId,
    link_to: {
      project_id: projectId
    },
    category,
    description: `Project ${category}`
  };

  return uploadFile(file, context);
}

export async function uploadInvoice(
  file: File,
  organizationId: string,
  movementId?: string
): Promise<UploadResult> {
  const context: UploadContext = {
    entity: 'invoice',
    organization_id: organizationId,
    link_to: movementId ? {
      movement_id: movementId
    } : undefined,
    category: 'invoice',
    description: 'Invoice document'
  };

  return uploadFile(file, context);
}

export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  const context: UploadContext = {
    entity: 'user_avatar',
    user_id: userId,
    category: 'avatar',
    description: 'User avatar',
    is_cover: true
  };

  return uploadFile(file, context);
}

export async function uploadOrgLogo(
  file: File,
  organizationId: string
): Promise<UploadResult> {
  const context: UploadContext = {
    entity: 'org_logo',
    organization_id: organizationId,
    category: 'logo',
    description: 'Organization logo',
    is_cover: true
  };

  return uploadFile(file, context);
}
