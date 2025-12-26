import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageCompression';
import { getFileUrl } from './getFileUrl';
import type { BucketName } from './types';
export interface UploadedCourseImage {
  file_url: string;
  file_path: string;
}
/**
 * Generate unique file path for course cover image
 * Path: marketplace/courses/{courseId}/cover/{filename}
 */
function generateCourseCoverImagePath(courseId: string, fileName: string): string {
  const ext = fileName.split('.').pop() || 'png';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  return `marketplace/courses/${courseId}/cover/${uniqueName}`;
}
/**
 * Upload course cover image to course_details
 * Saves metadata to course_details (image_bucket, image_path) - 1:1 relationship
 * Image is stored in public-assets bucket
 */
export async function uploadCourseImageToCourseDetails(
  file: File,
  courseId: string
): Promise<UploadedCourseImage> {
  try {
    if (!file || file.size === 0) {
      throw new Error('Archivo vacío o inválido');
    }
    if (!file.type.startsWith('image/')) {
      throw new Error('Solo se permiten archivos de imagen');
    }
    // Compress image before uploading
    const compressedFile = await compressImage(file, 'course-cover');
    
    // Validate file size after compression (max 2MB)
    if (compressedFile.size > 2 * 1024 * 1024) {
      throw new Error('La imagen no puede superar los 2MB después de la compresión');
    }
    // Generate unique file path
    const filePath = generateCourseCoverImagePath(courseId, compressedFile.name);
    const bucket: BucketName = 'public-assets';
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
    // Save metadata to course_details (NOT media_files)
    // 1:1 relationship - course cover is stored directly here
    const { error: dbError } = await supabase
      .from('course_details')
      .upsert({
        course_id: courseId,
        image_bucket: bucket,
        image_path: filePath,
      }, {
        onConflict: 'course_id'
      });
    if (dbError) {
      // Cleanup: delete file from storage if DB insert fails
      await supabase.storage.from(bucket).remove([filePath]);
      throw new Error(`Error al registrar archivo: ${dbError.message}`);
    }
    // Generate URL for immediate display
    const imageUrl = await getFileUrl(bucket, filePath, 3600, supabase);
    return {
      file_url: imageUrl,
      file_path: filePath
    };
  } catch (error) {
    throw error;
  }
}
/**
 * Get course image URL by loading bucket+path from DB and generating URL on-demand
 */
export async function getCourseCoverImageUrl(courseId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('course_details')
    .select('image_bucket, image_path')
    .eq('course_id', courseId)
    .single();
  
  if (error || !data?.image_bucket || !data?.image_path) {
    return null;
  }
  
  return await getFileUrl(data.image_bucket as BucketName, data.image_path, 3600, supabase);
}
/**
 * Get course image URL from existing course details data (avoids DB query)
 */
export async function getCourseCoverImageUrlFromData(
  courseDetails: { image_bucket?: string | null; image_path?: string | null }
): Promise<string | null> {
  if (!courseDetails.image_bucket || !courseDetails.image_path) {
    return null;
  }
  
  return await getFileUrl(courseDetails.image_bucket as BucketName, courseDetails.image_path, 3600, supabase);
}
/**
 * Delete course cover image
 * Removes from storage and clears metadata from course_details
 */
export async function deleteCourseCoverImage(
  courseId: string,
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
    // Clear metadata from course_details
    await supabase
      .from('course_details')
      .update({
        image_bucket: null,
        image_path: null,
      })
      .eq('course_id', courseId);
  } catch (error) {
    throw error;
  }
}
