import { nanoid } from 'nanoid';
import type { EntityType, UploadContext, StoragePath } from './types';
import { getEntityConfig } from './config';
export function buildStoragePath(
  file: File,
  context: UploadContext
): StoragePath {
  const config = getEntityConfig(context.entity);
  let basePath = config.basePath;
  basePath = basePath
    .replace('{user_id}', context.user_id || '')
    .replace('{org_id}', context.organization_id || '')
    .replace('{project_id}', context.project_id || '')
    .replace('{course_id}', context.course_id || '');
  const extension = file.name.split('.').pop() || 'bin';
  const uniqueId = nanoid(10);
  const fileName = `${uniqueId}.${extension}`;
  
  const fullPath = `${basePath}/${fileName}`;
  return {
    bucket: config.bucket,
    path: fullPath,
    fullPath
  };
}
export function buildCoverPath(
  file: File,
  entity: EntityType,
  context: UploadContext
): StoragePath {
  const config = getEntityConfig(entity);
  let basePath = config.basePath;
  basePath = basePath
    .replace('{user_id}', context.user_id || '')
    .replace('{org_id}', context.organization_id || '')
    .replace('{project_id}', context.project_id || '')
    .replace('{course_id}', context.course_id || '');
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `cover.${extension}`;
  
  const fullPath = `${basePath}/${fileName}`;
  return {
    bucket: config.bucket,
    path: fullPath,
    fullPath
  };
}
export function validateContext(context: UploadContext): void {
  const config = getEntityConfig(context.entity);
  
  if (config.basePath.includes('{user_id}') && !context.user_id) {
    throw new Error(`user_id is required for entity type: ${context.entity}`);
  }
  
  if (config.basePath.includes('{org_id}') && !context.organization_id) {
    throw new Error(`organization_id is required for entity type: ${context.entity}`);
  }
  
  if (config.basePath.includes('{project_id}') && !context.project_id) {
    throw new Error(`project_id is required for entity type: ${context.entity}`);
  }
  
  if (config.basePath.includes('{course_id}') && !context.course_id) {
    throw new Error(`course_id is required for entity type: ${context.entity}`);
  }
}
