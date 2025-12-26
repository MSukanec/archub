import { supabase } from '@/lib/supabase';
import type { UploadMediaInputV2, UploadMediaResultV2, MediaFileType } from '../types';
import { nanoid } from 'nanoid';
/**
 * Sube un archivo usando la nueva arquitectura de dos tablas:
 * - media_files: Registro centralizado del archivo físico
 * - media_links: Relación con entidades (proyectos, sitelogs, etc.)
 * 
 * Proceso:
 * 1. Sube el archivo al bucket de Supabase Storage
 * 2. Crea registro en media_files
 * 3. Crea registro en media_links vinculando con la entidad
 * 
 * @param input - Datos del archivo y relaciones
 * @returns IDs del archivo y link creados
 * @throws {Error} Si falla alguna operación (rollback automático)
 */
export async function uploadMediaFileV2(input: UploadMediaInputV2): Promise<UploadMediaResultV2> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  const {
    file,
    organization_id = null,
    created_by = null,
    bucket = 'media',
    project_id,
    site_log_id,
    movement_id,
    contact_id,
    course_lesson_id,
    general_cost_id,
    client_payment_id,
    course_id,
    course_module_id,
    visibility = 'organization',
    description,
    category,
    is_cover = false,
    position,
    metadata = {}
  } = input;
  // Validar que al menos una entidad esté presente
  if (!project_id && !site_log_id && !movement_id && !contact_id && !course_lesson_id && !general_cost_id && !client_payment_id && !course_id && !course_module_id) {
    throw new Error('Se requiere al menos una entidad relacionada (project_id, site_log_id, course_id, etc.)');
  }
  // Generate unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${nanoid()}.${fileExt}`;
  const filePath = organization_id && project_id 
    ? `${organization_id}/${project_id}/${fileName}`
    : organization_id
    ? `${organization_id}/${fileName}`
    : course_id
    ? `courses/${course_id}/${fileName}`
    : `global/${fileName}`;
  // Determinar tipo de archivo
  const fileType: MediaFileType = file.type.startsWith('image/') ? 'image'
    : file.type.startsWith('video/') ? 'video'
    : file.type === 'application/pdf'? 'pdf'
    : file.type.includes('document') || file.type.includes('word') ? 'doc'
    : 'other';
  try {
    // 1. Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    if (uploadError) throw uploadError;
    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    // 3. Create media_files record
    const { data: mediaFile, error: mediaFileError } = await supabase
      .from('media_files')
      .insert({
        organization_id,
        created_by,
        bucket,
        file_path: filePath,
        file_name: file.name,
        file_url: publicUrl,
        file_type: fileType,
        file_size: file.size,
        is_public: visibility === 'public', // Only public for course media
        is_deleted: false
      })
      .select('id')
      .single();
    if (mediaFileError) {
      // Rollback: delete from storage
      await supabase.storage.from(bucket).remove([filePath]);
      throw mediaFileError;
    }
    // 4. Create media_links record
    // Determine if this is public (course-related media is always public)
    const isPublic = !!(course_id || course_module_id || course_lesson_id);
    
    const { data: mediaLink, error: mediaLinkError } = await supabase
      .from('media_links')
      .insert({
        media_file_id: mediaFile.id,
        organization_id,
        project_id: project_id || null,
        site_log_id: site_log_id || null,
        movement_id: movement_id || null,
        contact_id: contact_id || null,
        course_lesson_id: course_lesson_id || null,
        general_cost_id: general_cost_id || null,
        client_payment_id: client_payment_id || null,
        course_id: course_id || null,
        course_module_id: course_module_id || null,
        created_by,
        visibility,
        description: description || null,
        category: category || null,
        is_cover,
        position: position || null,
        metadata,
        is_public: isPublic
      })
      .select('id')
      .single();
    if (mediaLinkError) {
      // Rollback: delete media_files record and storage
      await supabase.from('media_files').delete().eq('id', mediaFile.id);
      await supabase.storage.from(bucket).remove([filePath]);
      throw mediaLinkError;
    }
    return {
      media_file_id: mediaFile.id,
      link_id: mediaLink.id,
      file_url: publicUrl,
      file_path: filePath
    };
  } catch (error) {
    console.error('Error uploading media file V2:', error);
    throw error;
  }
}
