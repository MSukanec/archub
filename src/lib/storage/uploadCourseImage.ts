import { supabase } from '@/lib/supabase';

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

    // Get current session for created_by
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Generate file path: courses/[course_id]/hero.[extension]
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `hero.${extension}`;
    const filePath = `courses/${courseId}/${fileName}`;

    console.log('Uploading course image:', filePath);

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('course-cover')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading course image:', uploadError);
      throw new Error(`Error al subir imagen: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('course-cover')
      .getPublicUrl(filePath);

    const urlWithCacheBust = `${urlData.publicUrl}?t=${Date.now()}`;

    // Check if media_files record already exists for this path
    const { data: existingMediaFile } = await supabase
      .from('media_files')
      .select('id')
      .eq('file_path', filePath)
      .maybeSingle();

    let mediaFileId: string;

    if (existingMediaFile) {
      // Update existing record and ensure is_deleted is false
      const { data: updatedFile, error: updateError } = await supabase
        .from('media_files')
        .update({
          file_url: urlData.publicUrl,
          file_type: 'image',
          file_size: file.size,
          is_public: true,
          is_deleted: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMediaFile.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating media_files record:', updateError);
        throw new Error(`Error al actualizar archivo: ${updateError.message}`);
      }
      mediaFileId = updatedFile.id;
    } else {
      // Create new media_files record with is_public=true
      const { data: newFile, error: insertError } = await supabase
        .from('media_files')
        .insert({
          bucket: 'course-cover',
          file_path: filePath,
          file_name: fileName,
          file_url: urlData.publicUrl,
          file_type: 'image',
          file_size: file.size,
          is_public: true,
          is_deleted: false,
          created_by: userId
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating media_files record:', insertError);
        throw new Error(`Error al registrar archivo: ${insertError.message}`);
      }
      mediaFileId = newFile.id;
    }

    // Clean up ALL existing media_links for this course's cover images
    // This handles legacy rows and different file extensions
    const { data: allCourseLinks } = await supabase
      .from('media_links')
      .select('media_file_id, media_files!inner(file_path)')
      .eq('course_id', courseId);

    // Filter to only cover image links (file_path contains 'hero')
    const coverImageLinks = (allCourseLinks || []).filter((link: any) => 
      link.media_files?.file_path?.includes('/hero.')
    );

    if (coverImageLinks.length > 0) {
      // Soft-delete old media_files and delete their links
      for (const link of coverImageLinks) {
        // Soft-delete media_file
        await supabase
          .from('media_files')
          .update({ is_deleted: true })
          .eq('id', link.media_file_id);

        // Delete media_link
        await supabase
          .from('media_links')
          .delete()
          .eq('course_id', courseId)
          .eq('media_file_id', link.media_file_id);
      }
    }

    // Create new media_links record with visibility='public'
    const { error: mediaLinkError } = await supabase
      .from('media_links')
      .insert({
        media_file_id: mediaFileId,
        course_id: courseId,
        visibility: 'public',
        created_by: userId,
        description: 'Course cover image'
      });

    if (mediaLinkError) {
      console.error('Error creating media_links record:', mediaLinkError);
      throw new Error(`Error al crear link de imagen: ${mediaLinkError.message}`);
    }

    return {
      file_url: urlWithCacheBust,
      file_path: filePath,
      media_file_id: mediaFileId
    };
  } catch (error) {
    console.error('Error processing course image:', error);
    throw error;
  }
}

export async function deleteCourseImage(filePath: string, courseId?: string): Promise<void> {
  try {
    // Delete from storage
    const { error } = await supabase.storage
      .from('course-cover')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting course image:', error);
      throw new Error(`Error al eliminar imagen: ${error.message}`);
    }

    // Get media_file_id for this path
    const { data: mediaFile } = await supabase
      .from('media_files')
      .select('id')
      .eq('file_path', filePath)
      .maybeSingle();

    if (mediaFile) {
      // Soft delete media_files record
      const { error: mediaFileError } = await supabase
        .from('media_files')
        .update({ is_deleted: true })
        .eq('id', mediaFile.id);

      if (mediaFileError) {
        console.error('Error deleting media_files record:', mediaFileError);
        // Don't fail - the file is already deleted from storage
      }

      // Delete the specific media_link for this cover image
      if (courseId) {
        const { error: mediaLinkError } = await supabase
          .from('media_links')
          .delete()
          .eq('course_id', courseId)
          .eq('media_file_id', mediaFile.id)
          .eq('description', 'Course cover image');

        if (mediaLinkError) {
          console.error('Error deleting media_links record:', mediaLinkError);
          // Don't fail
        }
      }
    }
  } catch (error) {
    console.error('Error deleting course image:', error);
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
    console.error('Error updating course image URL:', error);
    throw error;
  }
}
