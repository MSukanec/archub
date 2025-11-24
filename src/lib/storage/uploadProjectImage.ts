import { supabase } from '@/lib/supabase';
import { uploadFile } from './uploadFile';
import { getFileUrl } from './getFileUrl';
import type { UploadContext, BucketName } from './types';

export interface UploadedProjectImage {
  file_url: string;
  file_path: string;
}

/**
 * Updates project image metadata with bucket and path (NOT signed URL).
 * This prevents expiring URLs from being stored in the database.
 */
export async function updateProjectImageMetadata(
  projectId: string,
  organizationId: string,
  bucket: BucketName,
  path: string
): Promise<void> {
  const { error } = await supabase
    .from('project_data')
    .upsert({
      project_id: projectId,
      organization_id: organizationId,
      image_bucket: bucket,
      image_path: path,
      // DO NOT update project_image_url with signed URL - it will expire!
    }, {
      onConflict: 'project_id'
    });

  if (error) {
    console.error('Error updating project image metadata:', error);
    throw new Error(`Failed to update project image: ${error.message}`);
  }
}

/**
 * Get project image URL by loading bucket+path from DB and generating signed URL on-demand.
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
  
  return await getFileUrl(data.image_bucket as BucketName, data.image_path);
}

/**
 * Get project image URL from existing project data (avoids DB query).
 */
export async function getProjectImageUrlFromData(
  project: { image_bucket?: string | null; image_path?: string | null }
): Promise<string | null> {
  if (!project.image_bucket || !project.image_path) {
    return null;
  }
  
  return await getFileUrl(project.image_bucket as BucketName, project.image_path);
}

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

    const context: UploadContext = {
      entity: 'project_photo',
      organization_id: organizationId,
      project_id: projectId,
      link_to: {
        project_id: projectId
      },
      category: 'project_cover',
      description: 'Project cover image',
      is_cover: true
    };

    const result = await uploadFile(file, context);

    // Save bucket + path (NOT signed URL) to prevent expiration issues
    await updateProjectImageMetadata(projectId, organizationId, result.bucket, result.file_path);

    // Generate temporary URL for immediate display
    const imageUrl = await getFileUrl(result.bucket, result.file_path);

    return {
      file_url: imageUrl,
      file_path: result.file_path
    };
  } catch (error) {
    console.error('Error processing project image:', error);
    throw error;
  }
}

export async function deleteProjectImage(
  projectId: string,
  organizationId: string,
  bucket: string,
  path: string
): Promise<void> {
  try {
    // Delete from storage using provided bucket and path
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (storageError) {
      console.error('Error deleting project image from storage:', storageError);
      throw new Error(`Error al eliminar imagen: ${storageError.message}`);
    }

    // Mark media file as deleted in database
    await supabase
      .from('media_files')
      .update({ is_deleted: true })
      .eq('file_path', path)
      .eq('bucket', bucket);

    // Clean up project_data metadata
    await supabase
      .from('project_data')
      .update({
        image_bucket: null,
        image_path: null,
        project_image_url: null
      })
      .eq('project_id', projectId);
  } catch (error) {
    console.error('Error deleting project image:', error);
    throw error;
  }
}

export async function updateProjectImageUrl(
  projectId: string,
  imageUrl: string | null
): Promise<void> {
  try {
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .eq('is_deleted', false)
      .single();

    if (projectError || !projectData) {
      console.error('Error getting project organization:', projectError);
      throw new Error(`Error al obtener organización del proyecto: ${projectError?.message || 'Proyecto no encontrado'}`);
    }

    const { error } = await supabase
      .from('project_data')
      .upsert({
        project_id: projectId,
        organization_id: projectData.organization_id,
        project_image_url: imageUrl
      }, {
        onConflict: 'project_id'
      });

    if (error) {
      console.error('Error updating project image URL:', error);
      throw new Error(`Error al actualizar URL de imagen: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating project image URL:', error);
    throw error;
  }
}
