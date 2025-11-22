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

    // Fetch ALL candidate cover links using strict predicate
    // Handles: flagged covers, legacy records, and hero file patterns
    const { data: candidateLinks } = await supabase
      .from('media_links')
      .select('id, media_file_id, category, is_cover, created_at, media_files!inner(file_path)')
      .eq('course_id', courseId);

    // Filter to only cover-related links based on strict criteria
    const coverCandidates = (candidateLinks || []).filter((link: any) => {
      // Match by category flag
      if (link.category === 'course_cover') return true;
      // Match by is_cover flag
      if (link.is_cover === true) return true;
      // Match legacy by file_path pattern
      if (link.media_files?.file_path?.includes('/hero.')) return true;
      return false;
    });

    // Deduplicate by ID (in case of overlapping matches)
    const uniqueCandidates = Array.from(
      new Map(coverCandidates.map(link => [link.id, link])).values()
    );

    // Sort: prefer flagged rows first, then by created_at DESC
    const sortedCandidates = uniqueCandidates.sort((a, b) => {
      // Prefer rows with category='course_cover' or is_cover=true
      const aFlagged = a.category === 'course_cover' || a.is_cover === true;
      const bFlagged = b.category === 'course_cover' || b.is_cover === true;
      if (aFlagged !== bFlagged) return bFlagged ? 1 : -1;
      // Then sort by created_at DESC
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    if (sortedCandidates.length > 0) {
      // Pick the canonical link (flagged + newest)
      const linkToKeep = sortedCandidates[0];
      
      // Soft-delete outdated cover media_files (not the new one)
      const oldCoverFileIds = sortedCandidates
        .map(link => link.media_file_id)
        .filter(id => id !== mediaFileId);
      
      if (oldCoverFileIds.length > 0) {
        await supabase
          .from('media_files')
          .update({ is_deleted: true })
          .in('id', oldCoverFileIds);
      }

      // Hard-delete extra cover links (keep only canonical one)
      if (sortedCandidates.length > 1) {
        const linksToDelete = sortedCandidates.slice(1).map(link => link.id);
        await supabase
          .from('media_links')
          .delete()
          .in('id', linksToDelete);
      }

      // Update the canonical link with new metadata
      const { error: updateError } = await supabase
        .from('media_links')
        .update({
          media_file_id: mediaFileId,
          visibility: 'public',
          is_public: true,
          category: 'course_cover',
          is_cover: true,
          description: 'Course cover image'
        })
        .eq('id', linkToKeep.id);

      if (updateError) {
        console.error('Error updating media_links record:', updateError);
        throw new Error(`Error al actualizar link de imagen: ${updateError.message}`);
      }
    } else {
      // No existing cover links - insert new one
      const { error: insertError } = await supabase
        .from('media_links')
        .insert({
          media_file_id: mediaFileId,
          course_id: courseId,
          visibility: 'public',
          is_public: true,
          category: 'course_cover',
          is_cover: true,
          created_by: userId,
          description: 'Course cover image'
        });

      if (insertError) {
        console.error('Error creating media_links record:', insertError);
        throw new Error(`Error al crear link de imagen: ${insertError.message}`);
      }
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
