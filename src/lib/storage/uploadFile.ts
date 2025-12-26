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
    // Verify active session before upload
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('No hay sesión activa - por favor inicia sesión nuevamente');
    }
    
    if (!file || !(file instanceof File)) {
      throw new Error(`Invalid file object: ${typeof file}`);
    }
    
    validateContext(context);

    const config = getEntityConfig(context.entity);
    const compressionPreset = getCompressionPreset(context.entity);
    
    // Guardar tamaño original para stats de compresión
    const originalSize = file.size;
    
    let processedFile = file;
    if (shouldCompress(file)) {
      processedFile = await compressImage(file, compressionPreset);
    }

    const storagePath = buildStoragePath(processedFile, context);

    const uploadResponse = await supabase.storage
      .from(storagePath.bucket)
      .upload(storagePath.path, processedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadResponse.error) {
      throw new Error(`Error al subir archivo al storage: ${uploadResponse.error.message || 'Verifica los permisos del bucket'}`);
    }

    const isPublicBucket = storagePath.bucket === 'public-assets';
    let fileUrl: string | null = null;
    
    if (isPublicBucket) {
      fileUrl = supabase.storage.from(storagePath.bucket).getPublicUrl(storagePath.path).data.publicUrl;
    }
    
    const isPublic = isPublicBucket || storagePath.bucket === 'social-assets';

    const fileType = getFileType(file.type);
    
    // Usar created_by_member_id si se proporciona (organization_member.id), sino usar auth user_id
    const createdById = context.created_by_member_id || session?.user?.id || context.user_id;

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
        created_by: createdById
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
      
      // Build media_link object only with defined values (Handles 3 cases: A) no org, B) with org no project, C) with org and project)
      const mediaLinkData: Record<string, any> = {
        media_file_id: mediaFile.id,
        visibility,
        is_public: isPublic,
        is_cover: context.is_cover || false,
        created_by: createdById
      };

      // Add optional fields ONLY if they are defined
      if (context.organization_id) mediaLinkData.organization_id = context.organization_id;
      // Use project_id from link_to if available, otherwise from context
      if (context.link_to.project_id || context.project_id) {
        mediaLinkData.project_id = context.link_to.project_id || context.project_id;
      }
      if (context.link_to.contact_id) mediaLinkData.contact_id = context.link_to.contact_id;
      if (context.link_to.general_cost_id) mediaLinkData.general_cost_id = context.link_to.general_cost_id;
      if (context.link_to.general_cost_payment_id) mediaLinkData.general_cost_payment_id = context.link_to.general_cost_payment_id;
      if (context.link_to.sitelog_id) mediaLinkData.site_log_id = context.link_to.sitelog_id;
      if (context.link_to.course_id) mediaLinkData.course_id = context.link_to.course_id;
      if (context.link_to.course_module_id) mediaLinkData.course_module_id = context.link_to.course_module_id;
      if (context.link_to.course_lesson_id) mediaLinkData.course_lesson_id = context.link_to.course_lesson_id;
      if (context.link_to.client_payment_id) mediaLinkData.client_payment_id = context.link_to.client_payment_id;
      if (context.link_to.material_payment_id) mediaLinkData.material_payment_id = context.link_to.material_payment_id;
      if (context.link_to.material_purchase_id) mediaLinkData.material_purchase_id = context.link_to.material_purchase_id;
      if (context.link_to.personnel_payment_id) mediaLinkData.personnel_payment_id = context.link_to.personnel_payment_id;
      if (context.link_to.partner_contribution_id) mediaLinkData.partner_contribution_id = context.link_to.partner_contribution_id;
      if (context.link_to.partner_withdrawal_id) mediaLinkData.partner_withdrawal_id = context.link_to.partner_withdrawal_id;
      if (context.link_to.testimonial_id) mediaLinkData.testimonial_id = context.link_to.testimonial_id;
      if (context.link_to.hero_section_id) mediaLinkData.hero_section_id = context.link_to.hero_section_id;
      if (context.link_to.forum_thread_id) mediaLinkData.forum_thread_id = context.link_to.forum_thread_id;
      if (context.link_to.pin_id) mediaLinkData.pin_id = context.link_to.pin_id;
      if (context.category) mediaLinkData.category = context.category;
      if (context.description) mediaLinkData.description = context.description;
      if (context.position !== undefined) mediaLinkData.position = context.position;
      if (context.metadata) mediaLinkData.metadata = context.metadata;
      
      const { data: mediaLink, error: mediaLinkError } = await supabase
        .from('media_links')
        .insert(mediaLinkData)
        .select()
        .single();

      if (mediaLinkError) {
        throw new Error(`Error al vincular archivo: ${mediaLinkError.message}`);
      }
      
      if (mediaLink) {
        mediaLinkId = mediaLink.id;
      }
    }

    const urlWithCacheBust = `${fileUrl}?t=${Date.now()}`;
    
    // Calcular stats de compresión
    const wasCompressed = originalSize !== processedFile.size;

    return {
      media_file_id: mediaFile.id,
      media_link_id: mediaLinkId,
      file_url: urlWithCacheBust,
      file_path: storagePath.path,
      bucket: storagePath.bucket,
      compressionStats: {
        originalSize,
        compressedSize: processedFile.size,
        wasCompressed
      }
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
