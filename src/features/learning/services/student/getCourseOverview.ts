import { supabase } from '@/lib/supabase';
import type { Course } from '@shared/schema';

/**
 * Obtiene la información básica de un curso con cover_url resuelto.
 * 
 * Query directa a la tabla courses. Retorna información general
 * del curso sin módulos, lecciones ni progreso.
 * 
 * Resuelve cover_url desde course_details o media_links.
 * 
 * Útil para páginas de landing, listados, y cargas rápidas.
 * 
 * @param courseIdOrSlug - ID o slug del curso
 * @returns Curso con información básica y cover_url resuelto o null si no existe
 * @throws {Error} Si falla la query principal
 */
export async function getCourseOverview(
  courseIdOrSlug: string
): Promise<(Course & { cover_url?: string }) | null> {
  if (!courseIdOrSlug) {
    return null;
  }

  // Intentar primero por ID (UUID format)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseIdOrSlug);
  
  let query = supabase
    .from('courses')
    .select(`
      *,
      course_details (
        image_bucket,
        image_path
      )
    `)
    .eq('is_deleted', false);

  if (isUuid) {
    query = query.eq('id', courseIdOrSlug);
  } else {
    query = query.eq('slug', courseIdOrSlug);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  // Resolve cover_url from course_details
  let cover_url: string | null = null;
  const courseDetails = Array.isArray(data.course_details) 
    ? data.course_details[0] 
    : data.course_details;

  if (courseDetails?.image_bucket && courseDetails?.image_path) {
    if (courseDetails.image_bucket === 'public-assets') {
      cover_url = supabase.storage
        .from(courseDetails.image_bucket)
        .getPublicUrl(courseDetails.image_path).data.publicUrl;
    } else {
      const { data: signedData } = await supabase.storage
        .from(courseDetails.image_bucket)
        .createSignedUrl(courseDetails.image_path, 3600);
      if (signedData?.signedUrl) {
        cover_url = signedData.signedUrl;
      }
    }
  }

  // Fallback: fetch from media_links if no cover from course_details
  if (!cover_url) {
    const { data: mediaLink } = await supabase
      .from('media_links')
      .select(`
        media_files!inner (
          file_url,
          is_deleted
        )
      `)
      .eq('course_id', data.id)
      .eq('category', 'course_cover')
      .eq('media_files.is_deleted', false)
      .maybeSingle();

    const mediaFile = Array.isArray(mediaLink?.media_files) 
      ? mediaLink.media_files[0] 
      : mediaLink?.media_files;
    if (mediaFile?.file_url) {
      cover_url = mediaFile.file_url;
    }
  }

  // Remove course_details from result and add resolved cover_url
  const { course_details: _, ...courseWithoutDetails } = data;
  
  return {
    ...courseWithoutDetails,
    cover_url: cover_url || undefined,
  } as Course & { cover_url?: string };
}
