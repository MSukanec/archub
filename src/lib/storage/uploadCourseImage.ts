import { supabase } from '@/lib/supabase';
import { uploadFile } from './uploadFile';
import { getFileUrl } from './getFileUrl';
import type { UploadContext } from './types';
export interface UploadedCourseImage {
  file_url: string;
  file_path: string;
  media_file_id: string;
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
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const { data: candidateLinks } = await supabase
      .from('media_links')
      .select('id, media_file_id, category, is_cover, created_at, media_files!inner(file_path)')
      .eq('course_id', courseId);
    const coverCandidates = (candidateLinks || []).filter((link: any) => {
      if (link.category === 'course_cover') return true;
      if (link.is_cover === true) return true;
      if (link.media_files?.file_path?.includes('/hero.')) return true;
      return false;
    });
    const uniqueCandidates = Array.from(
      new Map(coverCandidates.map(link => [link.id, link])).values()
    );
    const sortedCandidates = uniqueCandidates.sort((a, b) => {
      const aFlagged = a.category === 'course_cover'|| a.is_cover === true;
      const bFlagged = b.category === 'course_cover'|| b.is_cover === true;
      if (aFlagged !== bFlagged) return bFlagged ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    const context: UploadContext = {
      entity: 'course_cover_public',
      link_to: {
        course_id: courseId
      },
      category: 'course_cover',
      description: 'Course cover image',
      is_cover: true,
      user_id: userId
    };
    const result = await uploadFile(file, context);
    if (sortedCandidates.length > 0) {
      const oldCoverFileIds = sortedCandidates
        .map(link => link.media_file_id)
        .filter(id => id !== result.media_file_id);
      
      if (oldCoverFileIds.length > 0) {
        await supabase
          .from('media_files')
          .update({ is_deleted: true })
          .in('id', oldCoverFileIds);
      }
      if (sortedCandidates.length > 0 && result.media_link_id) {
        const linksToDelete = sortedCandidates.map(link => link.id);
        await supabase
          .from('media_links')
          .delete()
          .in('id', linksToDelete);
      }
    }
    const fileUrl = await getFileUrl(result.bucket, result.file_path);
    return {
      file_url: fileUrl,
      file_path: result.file_path,
      media_file_id: result.media_file_id
    };
  } catch (error) {
    throw error;
  }
}
export async function deleteCourseImage(filePath: string, courseId?: string): Promise<void> {
  try {
    const { data: mediaFile } = await supabase
      .from('media_files')
      .select('id, bucket')
      .eq('file_path', filePath)
      .maybeSingle();
    if (mediaFile) {
      const { error } = await supabase.storage
        .from(mediaFile.bucket)
        .remove([filePath]);
      if (error) {
      }
      await supabase
        .from('media_files')
        .update({ is_deleted: true })
        .eq('id', mediaFile.id);
      if (courseId) {
        await supabase
          .from('media_links')
          .delete()
          .eq('course_id', courseId)
          .eq('media_file_id', mediaFile.id);
      }
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
