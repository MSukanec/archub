import { uploadFile } from './uploadFile';
import type { UploadContext, UploadResult } from './types';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageCompression';
import { getFileUrl } from './getFileUrl';
import type { BucketName } from './types';

/**
 * Generate unique file path for contact avatar
 * Path: organizations/{organization_id}/contacts/avatars/{filename}
 */
function generateContactAvatarPath(organizationId: string, contactId: string, fileName: string): string {
  const ext = fileName.split('.').pop() || 'png';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  return `organizations/${organizationId}/contacts/avatars/${uniqueName}`;
}

/**
 * Upload contact avatar directly to storage (no media_files)
 * Saves image_bucket and image_path to contacts table (like project_data)
 */
export async function uploadContactAvatarDirect(
  file: File,
  contactId: string,
  organizationId: string
): Promise<{ url: string }> {
  try {
    if (!file || file.size === 0) {
      throw new Error('Archivo vacío o inválido');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Solo se permiten archivos de imagen');
    }

    // Compress image before uploading
    const compressedFile = await compressImage(file, 'avatar');
    
    // Validate file size after compression (max 1MB for avatars)
    if (compressedFile.size > 1 * 1024 * 1024) {
      throw new Error('La imagen no puede superar 1MB después de la compresión');
    }

    // Generate unique file path
    const filePath = generateContactAvatarPath(organizationId, contactId, compressedFile.name);
    const bucket: BucketName = 'private-assets';

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Error al subir archivo: ${uploadError.message}`);
    }

    // Save metadata to contacts table (image_bucket + image_path, like project_data)
    const { error: dbError } = await supabase
      .from('contacts')
      .update({
        image_bucket: bucket,
        image_path: filePath
      })
      .eq('id', contactId);

    if (dbError) {
      // Cleanup: delete file from storage if DB update fails
      await supabase.storage.from(bucket).remove([filePath]);
      throw new Error(`Error al guardar avatar: ${dbError.message}`);
    }

    // Generate signed URL for private assets (expires in 1 hour)
    const { data, error: urlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);

    if (urlError || !data?.signedUrl) {
      throw new Error(`Error al generar URL: ${urlError?.message || 'No URL generated'}`);
    }

    return { url: data.signedUrl };
  } catch (error) {
    throw error;
  }
}

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
  organizationId: string
): Promise<UploadResult> {
  const context: UploadContext = {
    entity: 'invoice',
    organization_id: organizationId,
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

/**
 * Get contact avatar URL by loading bucket+path from DB and generating signed URL on-demand
 */
export async function getContactAvatarUrl(contactId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select('image_bucket, image_path')
    .eq('id', contactId)
    .single();
  
  if (error || !data?.image_bucket || !data?.image_path) {
    return null;
  }

  try {
    const { data: urlData, error: urlError } = await supabase.storage
      .from(data.image_bucket as BucketName)
      .createSignedUrl(data.image_path, 3600);

    if (urlError || !urlData?.signedUrl) {
      return null;
    }

    return urlData.signedUrl;
  } catch (err) {
    return null;
  }
}

// Alias for compatibility
export async function uploadContactAvatar(
  file: File,
  contactId: string,
  organizationId: string
): Promise<{ url: string }> {
  return uploadContactAvatarDirect(file, contactId, organizationId);
}
