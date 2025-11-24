import { supabase } from '@/lib/supabase';
import { compressImage, shouldCompress } from '@/lib/imageCompression';
import type { UploadContext, UploadResult } from './types';
import { getEntityConfig, getCompressionPreset, getVisibility } from './config';
import { buildStoragePath, validateContext } from './pathBuilder';

export async function uploadFile(
  file: File,
  context: UploadContext
): Promise<UploadResult> {
  try {
    validateContext(context);

    const config = getEntityConfig(context.entity);
    const compressionPreset = getCompressionPreset(context.entity);
    
    let processedFile = file;
    if (shouldCompress(file)) {
      processedFile = await compressImage(file, compressionPreset);
    }

    const storagePath = buildStoragePath(processedFile, context);

    const { error: uploadError } = await supabase.storage
      .from(storagePath.bucket)
      .upload(storagePath.path, processedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Error al subir archivo: ${uploadError.message}`);
    }

    const isPublicBucket = storagePath.bucket === 'public-assets';
    let fileUrl: string | null = null;
    
    if (isPublicBucket) {
      fileUrl = supabase.storage.from(storagePath.bucket).getPublicUrl(storagePath.path).data.publicUrl;
    }
    
    const isPublic = isPublicBucket || storagePath.bucket === 'social-assets';

    const fileType = getFileType(file.type);
    
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id || context.user_id;

    const { data: mediaFile, error: mediaFileError } = await supabase
      .from('media_files')
      .insert({
        bucket: storagePath.bucket,
        file_path: storagePath.path,
        file_name: file.name,
        file_url: fileUrl || undefined,
        file_type: fileType,
        file_size: processedFile.size,
        is_public: isPublic,
        is_deleted: false,
        organization_id: context.organization_id,
        created_by: currentUserId
      })
      .select()
      .single();

    if (mediaFileError || !mediaFile) {
      await supabase.storage.from(storagePath.bucket).remove([storagePath.path]);
      throw new Error(`Error al registrar archivo: ${mediaFileError?.message || 'Unknown error'}`);
    }

    let mediaLinkId: string | undefined;

    if (context.link_to) {
      const visibility = getVisibility(context.entity);
      
      const { data: mediaLink, error: mediaLinkError } = await supabase
        .from('media_links')
        .insert({
          media_file_id: mediaFile.id,
          organization_id: context.organization_id,
          project_id: context.link_to.project_id,
          contact_id: context.link_to.contact_id,
          general_cost_id: context.link_to.general_cost_id,
          site_log_id: context.link_to.sitelog_id,
          course_id: context.link_to.course_id,
          course_module_id: context.link_to.course_module_id,
          course_lesson_id: context.link_to.course_lesson_id,
          movement_id: context.link_to.movement_id,
          client_payment_id: context.link_to.client_payment_id,
          visibility,
          is_public: isPublic,
          category: context.category,
          description: context.description,
          is_cover: context.is_cover || false,
          position: context.position,
          metadata: context.metadata,
          created_by: currentUserId
        })
        .select()
        .single();

      if (mediaLinkError) {
        console.error('Error creating media link:', mediaLinkError, {
          site_log_id: context.link_to.sitelog_id,
          course_id: context.link_to.course_id,
          contact_id: context.link_to.contact_id
        });
        throw new Error(`Error al vincular archivo: ${mediaLinkError.message}`);
      }
      
      if (mediaLink) {
        mediaLinkId = mediaLink.id;
      }
    }

    const urlWithCacheBust = `${fileUrl}?t=${Date.now()}`;

    return {
      media_file_id: mediaFile.id,
      media_link_id: mediaLinkId,
      file_url: urlWithCacheBust,
      file_path: storagePath.path,
      bucket: storagePath.bucket
    };
  } catch (error) {
    throw error;
  }
}

function getFileType(mimeType: string): 'image' | 'video' | 'pdf' | 'doc' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation')
  ) return 'doc';
  return 'other';
}

export async function deleteFile(
  mediaFileId: string,
  hardDelete: boolean = false
): Promise<void> {
  try {
    const { data: mediaFile, error: fetchError } = await supabase
      .from('media_files')
      .select('bucket, file_path, is_deleted')
      .eq('id', mediaFileId)
      .single();

    if (fetchError || !mediaFile) {
      throw new Error('Media file not found');
    }

    if (hardDelete) {
      const { error: storageError } = await supabase.storage
        .from(mediaFile.bucket)
        .remove([mediaFile.file_path]);

      await supabase
        .from('media_links')
        .delete()
        .eq('media_file_id', mediaFileId);

      const { error: deleteError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', mediaFileId);

      if (deleteError) {
        throw new Error(`Error al eliminar archivo: ${deleteError.message}`);
      }
    } else {
      const { error: softDeleteError } = await supabase
        .from('media_files')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', mediaFileId);

      if (softDeleteError) {
        throw new Error(`Error al marcar archivo como eliminado: ${softDeleteError.message}`);
      }
    }
  } catch (error) {
    throw error;
  }
}
