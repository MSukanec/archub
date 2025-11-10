import { supabase } from '@/lib/supabase';

export interface UploadedCourseImage {
  file_url: string;
  file_path: string;
}

export async function uploadCourseImage(
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

    // Generate file path: [course_id]/hero.[extension]
    const extension = file.name.split('.').pop() || 'jpg';
    const filePath = `${courseId}/hero.${extension}`;


    const { error: uploadError } = await supabase.storage
      .from('course-cover')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Error al subir imagen: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('course-cover')
      .getPublicUrl(filePath);

    const urlWithCacheBust = `${urlData.publicUrl}?t=${Date.now()}`;

    return {
      file_url: urlWithCacheBust,
      file_path: filePath
    };
  } catch (error) {
    throw error;
  }
}

export async function deleteCourseImage(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('course-cover')
      .remove([filePath]);

    if (error) {
      throw new Error(`Error al eliminar imagen: ${error.message}`);
    }
  } catch (error) {
    throw error;
  }
}

export async function updateCourseImageUrl(
  courseId: string,
  imageUrl: string | null
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        cover_url: imageUrl,
        updated_at: new Date().toISOString()
      })
    });

    if (!res.ok) {
      throw new Error('Failed to update course image URL');
    }
  } catch (error) {
    throw error;
  }
}
