import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageCompression';
import { getFileUrl } from './getFileUrl';
import type { BucketName } from './types';

export interface UploadedProjectImage {
  file_url: string;
  file_path: string;
}

/**
 * Generate unique file path for project cover image
 * Path: projects/{organization_id}/{project_id}/cover/{filename}
 */
function generateProjectImagePath(organizationId: string, projectId: string, fileName: string): string {
  const ext = fileName.split('.').pop() || 'png';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  return `projects/${organizationId}/${projectId}/cover/${uniqueName}`;
}

/**
 * Upload project cover image directly to storage
 * Saves metadata ONLY to project_data (no media_files)
 * Image is stored in social-assets bucket and publicly accessible via RLS
 */
export async function uploadProjectImage(
  file: File,
  projectId: string,
  organizationId: string
): Promise<UploadedProjectImage> {
  try {
    if (!file || file.size === 0) {
      throw new Error('Archivo vacío o inválido');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Solo se permiten archivos de imagen');
    }

    // Compress image before uploading
    const compressedFile = await compressImage(file, 'project-cover');
    
    // Validate file size after compression (max 2MB)
    if (compressedFile.size > 2 * 1024 * 1024) {
      throw new Error('La imagen no puede superar los 2MB después de la compresión');
    }

    // Generate unique file path
    const filePath = generateProjectImagePath(organizationId, projectId, compressedFile.name);
    const bucket: BucketName = 'social-assets';

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

    // Save metadata to project_data (NOT media_files)
    // social-assets is public, so is_public = true for RLS
    const { error: dbError } = await supabase
      .from('project_data')
      .upsert({
        project_id: projectId,
        organization_id: organizationId,
        image_bucket: bucket,
        image_path: filePath,
        is_public: true, // RLS: allow public access
      }, {
        onConflict: 'project_id'
      });

    if (dbError) {
      // Cleanup: delete file from storage if DB insert fails
      await supabase.storage.from(bucket).remove([filePath]);
      throw new Error(`Error al registrar archivo: ${dbError.message}`);
    }

    // Generate public URL synchronously for social-assets (avoids async overhead)
    // social-assets is a public bucket, so getPublicUrl is instantaneous
    const imageUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;

    return {
      file_url: imageUrl,
      file_path: filePath
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get project image URL by loading bucket+path from DB and generating URL on-demand
 * Returns null silently if the file doesn't exist in storage
 */
export async function getProjectImageUrl(projectId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('project_data')
    .select('image_bucket, image_path')
    .eq('project_id', projectId)
    .single();
  
  if (error || !data?.image_bucket || !data?.image_path) {
    return null;
  }
  
  try {
    return await getFileUrl(data.image_bucket as BucketName, data.image_path, 3600, supabase);
  } catch (err) {
    // File might have been deleted from storage - return null silently
    return null;
  }
}

/**
 * Get project image URL from existing project data (avoids DB query)
 * For public buckets (social-assets), returns URL synchronously without async overhead
 * Returns null silently if the file doesn't exist in storage
 */
export async function getProjectImageUrlFromData(
  project: { image_bucket?: string | null; image_path?: string | null }
): Promise<string | null> {
  if (!project.image_bucket || !project.image_path) {
    return null;
  }
  
  try {
    // For public buckets, getPublicUrl is synchronous and instantaneous
    if (project.image_bucket === 'social-assets' || project.image_bucket === 'public-assets') {
      return supabase.storage
        .from(project.image_bucket as BucketName)
        .getPublicUrl(project.image_path)
        .data.publicUrl;
    }
    
    // For private buckets, use async signed URL generation
    return await getFileUrl(project.image_bucket as BucketName, project.image_path, 3600, supabase);
  } catch (error) {
    // File might have been deleted from storage - return null silently
    return null;
  }
}

/**
 * Delete project cover image
 * Removes from storage and clears metadata from project_data
 */
export async function deleteProjectImage(
  projectId: string,
  organizationId: string,
  bucket: string,
  path: string
): Promise<void> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (storageError) {
      throw new Error(`Error al eliminar imagen: ${storageError.message}`);
    }

    // Clear metadata from project_data
    await supabase
      .from('project_data')
      .update({
        image_bucket: null,
        image_path: null,
        is_public: true // Reset to default
      })
      .eq('project_id', projectId);
  } catch (error) {
    throw error;
  }
}

/**
 * DEPRECATED: Use uploadProjectImage() instead
 * This function is kept for backward compatibility only
 */
export async function updateProjectImageUrl(
  projectId: string,
  imageUrl: string | null
): Promise<void> {
  console.warn('updateProjectImageUrl is deprecated. Use uploadProjectImage instead.');
  try {
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .eq('is_deleted', false)
      .single();

    if (projectError || !projectData) {
      throw new Error(`Error al obtener organización del proyecto: ${projectError?.message || 'Proyecto no encontrado'}`);
    }

    const { error } = await supabase
      .from('project_data')
      .upsert({
        project_id: projectId,
        organization_id: projectData.organization_id
      }, {
        onConflict: 'project_id'
      });

    if (error) {
      throw new Error(`Error al actualizar URL de imagen: ${error.message}`);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * DEPRECATED: Use uploadProjectImage() instead
 * This function is kept for backward compatibility only
 */
export async function updateProjectImageMetadata(
  projectId: string,
  organizationId: string,
  bucket: BucketName,
  path: string
): Promise<void> {
  console.warn('updateProjectImageMetadata is deprecated. Use uploadProjectImage instead.');
  const { error } = await supabase
    .from('project_data')
    .upsert({
      project_id: projectId,
      organization_id: organizationId,
      image_bucket: bucket,
      image_path: path,
    }, {
      onConflict: 'project_id'
    });

  if (error) {
    throw new Error(`Failed to update project image: ${error.message}`);
  }
}
