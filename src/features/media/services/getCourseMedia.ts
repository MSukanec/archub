import { supabase } from '@/lib/supabase';
import type { MediaFileWithLink, MediaCategory } from '../types';
interface GetCourseMediaInput {
  course_id: string;
  category?: MediaCategory;
  is_cover?: boolean;
}
/**
 * Obtiene archivos media vinculados a un curso
 * 
 * @param input - Filtros de búsqueda
 * @returns Lista de archivos con sus datos y metadatos
 */
export async function getCourseMedia(input: GetCourseMediaInput): Promise<MediaFileWithLink[]> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  const { course_id, category, is_cover } = input;
  let query = supabase
    .from('media_links')
    .select(`
      id,
      visibility,
      description,
      category,
      is_cover,
      position,
      created_at,
      created_by,
      course_id,
      course_module_id,
      organization_id,
      media_files!inner (
        id,
        file_url,
        file_name,
        file_type,
        file_size,
        file_path,
        bucket,
        is_deleted
      )
    `)
    .eq('course_id', course_id)
    .eq('media_files.is_deleted', false)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });
  // Filtros opcionales
  if (category) {
    query = query.eq('category', category);
  }
  if (is_cover !== undefined) {
    query = query.eq('is_cover', is_cover);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching course media:', error);
    throw error;
  }
  if (!data) {
    return [];
  }
  // Transformar al formato MediaFileWithLink
  return data.map((item: any) => ({
    // Datos del archivo (media_files)
    id: item.media_files.id,
    file_url: item.media_files.file_url,
    file_name: item.media_files.file_name || '',
    file_type: item.media_files.file_type,
    file_size: item.media_files.file_size,
    file_path: item.media_files.file_path,
    bucket: item.media_files.bucket,
    is_deleted: item.media_files.is_deleted,
    
    // Datos del link (media_links)
    link_id: item.id,
    course_id: item.course_id,
    course_module_id: item.course_module_id,
    organization_id: item.organization_id,
    visibility: item.visibility as any,
    description: item.description,
    category: item.category as MediaCategory,
    is_cover: item.is_cover,
    position: item.position,
    created_at: item.created_at,
    created_by: item.created_by,
    
    // Campos opcionales (null para cursos)
    project_id: null,
    site_log_id: null
  }));
}
/**
 * Obtiene la imagen de portada de un curso
 */
export async function getCourseCover(course_id: string): Promise<string | null> {
  const files = await getCourseMedia({
    course_id,
    category: 'course_cover',
    is_cover: true
  });
  return files.length > 0 ? files[0].file_url : null;
}
/**
 * Obtiene la foto del instructor de un curso
 */
export async function getCourseInstructorPhoto(course_id: string): Promise<string | null> {
  const files = await getCourseMedia({
    course_id,
    category: 'instructor_photo'
  });
  return files.length > 0 ? files[0].file_url : null;
}
/**
 * Obtiene la imagen OG para SEO
 */
export async function getCourseOgImage(course_id: string): Promise<string | null> {
  const files = await getCourseMedia({
    course_id,
    category: 'og_image'
  });
  return files.length > 0 ? files[0].file_url : null;
}
