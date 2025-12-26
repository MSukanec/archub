import { supabase } from '@/lib/supabase';

async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    return null;
  }
}

/**
 * Obtiene todas las bitácoras con sus relaciones completas.
 * 
 * Incluye:
 * - Eventos (site_log_events)
 * - Asistentes de personal (personnel_attendees)
 * - Archivos multimedia (media_files + media_links - nueva arquitectura)
 * 
 * @param projectId - ID del proyecto (opcional, si es undefined muestra todas las bitácoras de la organización)
 * @param organizationId - ID de la organización
 * @returns Array de site logs con todas las relaciones, o array vacío si no hay datos
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getSiteLogs(projectId: string | undefined, organizationId: string) {
  if (!supabase || !organizationId) {
    return [];
  }

  let query = supabase
    .from('site_logs')
    .select(`
      *,
      creator:organization_members(
        id,
        user:users(
          id,
          full_name,
          avatar_url
        )
      ),
      site_log_type:site_log_types(
        id,
        name,
        description
      )
    `)
    .eq('organization_id', organizationId);

  // Solo filtrar por proyecto si projectId está definido
  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data: logsData, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!logsData || logsData.length === 0) {
    return [];
  }

  const logIds = logsData?.map(log => log.id) || [];

  if (logIds.length === 0) {
    return [];
  }

  const { data: attendeesData, error: attendeesError } = await supabase
    .from('personnel_attendees')
    .select(`
      *,
      personnel:project_personnel(
        id,
        notes,
        contact:contacts(
          id,
          first_name,
          last_name
        )
      )
    `)
    .in('site_log_id', logIds);

  if (attendeesError) {
    // Non-fatal, just log silently
  }

  // Cargar archivos usando nueva arquitectura (media_files + media_links)
  const { data: filesData, error: filesError } = await supabase
    .from('media_links')
    .select(`
      id,
      media_file_id,
      site_log_id,
      description,
      category,
      position,
      created_at,
      metadata,
      media_files (
        id,
        file_url,
        file_name,
        file_type,
        file_size,
        file_path,
        bucket
      )
    `)
    .in('site_log_id', logIds)
    .eq('media_files.is_deleted', false);

  if (filesError) {
    console.error('Error loading sitelog files:', filesError);
  }

  // Generar signed URLs para archivos en private-assets
  const data = await Promise.all(logsData.map(async (log) => {
    const logFiles = filesData
      ?.filter(link => link.site_log_id === log.id && link.media_files)
      .map((link: any) => {
        const mediaFile = Array.isArray(link.media_files) ? link.media_files[0] : link.media_files;
        if (!mediaFile) return null;
        
        const displayName = link.metadata?.custom_file_name || mediaFile.file_name;
        
        return {
          id: mediaFile.id,
          link_id: link.id,
          file_url: mediaFile.file_url,
          file_name: displayName,
          file_type: mediaFile.file_type,
          file_size: mediaFile.file_size,
          bucket: mediaFile.bucket,
          file_path: mediaFile.file_path || mediaFile.file_name, // Para generar signed URL si es necesario
          description: link.description,
          category: link.category,
          position: link.position,
          created_at: link.created_at
        };
      })
      .filter(file => file !== null) || [];

    // Generar signed URLs para archivos privados
    const filesWithUrls = await Promise.all(
      logFiles.map(async (file: any) => {
        let displayUrl = file.file_url;
        
        if (file.bucket === 'private-assets' && file.file_path) {
          const signedUrl = await getSignedUrl(file.bucket, file.file_path);
          displayUrl = signedUrl || file.file_url;
        }
        
        return {
          ...file,
          file_url: displayUrl
        };
      })
    );

    return {
      ...log,
      creator: log.creator?.user ? {
        id: log.creator.user.id,
        full_name: log.creator.user.full_name,
        avatar_url: log.creator.user.avatar_url
      } : null,
      attendees: attendeesData?.filter(attendee => attendee.site_log_id === log.id) || [],
      files: filesWithUrls
    };
  }));

  return data || [];
}
