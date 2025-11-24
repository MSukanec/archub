import { supabase } from '@/lib/supabase';
import type { SitelogGalleryFile } from '../types';

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
 * Obtiene archivos multimedia (fotos y videos) de bitácoras.
 * 
 * Usa nueva arquitectura (media_links + media_files) para obtener
 * SOLO archivos asociados a bitácoras (site_log_id IS NOT NULL).
 * 
 * Incluye:
 * - Datos del archivo (file_url, file_name, file_type, file_size)
 * - Datos del link (link_id para eliminación)
 * - Datos de la bitácora asociada (fecha, tipo, descripción)
 * - Datos del proyecto (nombre)
 * 
 * @param organizationId - ID de la organización
 * @param projectId - ID del proyecto (opcional)
 * @returns Array de archivos multimedia de bitácoras ordenados por fecha
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getSitelogGalleryFiles(
  organizationId: string | undefined,
  projectId: string | undefined
): Promise<SitelogGalleryFile[]> {
  if (!organizationId || !supabase) {
    return [];
  }

  try {
    // Base query: JOIN entre media_links, media_files, site_logs y projects
    let query = supabase
      .from('media_links')
      .select(`
        id,
        media_file_id,
        organization_id,
        project_id,
        site_log_id,
        visibility,
        description,
        category,
        position,
        created_by,
        created_at,
        metadata,
        media_files!inner (
          id,
          file_url,
          file_name,
          file_type,
          file_size,
          file_path,
          bucket,
          is_deleted
        ),
        site_logs!inner (
          id,
          log_date,
          comments,
          entry_type_id,
          site_log_types:entry_type_id (
            id,
            name
          )
        ),
        projects (
          id,
          name
        )
      `)
      .eq('organization_id', organizationId)
      .not('site_log_id', 'is', null) // CRÍTICO: Solo archivos de bitácoras
      .eq('media_files.is_deleted', false)
      .in('media_files.file_type', ['image', 'video']); // Solo fotos y videos

    // Filtrar por proyecto si está definido
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    if (!data) return [];

    // Filtrar datos válidos primero
    const filteredData = data.filter((item: any) => {
      const mediaFile = Array.isArray(item.media_files) ? item.media_files[0] : item.media_files;
      const siteLog = Array.isArray(item.site_logs) ? item.site_logs[0] : item.site_logs;
      return mediaFile && siteLog;
    });

    // Mapear a estructura SitelogGalleryFile con signed URLs para private-assets
    const files: SitelogGalleryFile[] = await Promise.all(
      filteredData.map(async (item: any) => {
        const mediaFile = Array.isArray(item.media_files) ? item.media_files[0] : item.media_files;
        const siteLog = Array.isArray(item.site_logs) ? item.site_logs[0] : item.site_logs;
        const project = Array.isArray(item.projects) ? item.projects[0] : item.projects;
        
        let displayUrl = mediaFile.file_url;
        
        if (mediaFile.bucket === 'private-assets' && mediaFile.file_path) {
          const signedUrl = await getSignedUrl(mediaFile.bucket, mediaFile.file_path);
          displayUrl = signedUrl || mediaFile.file_url;
        }
        
        return {
          id: mediaFile.id,
          file_url: displayUrl,
          file_name: mediaFile.file_name,
          file_type: mediaFile.file_type,
          file_size: mediaFile.file_size,
          file_path: mediaFile.file_path,
          bucket: mediaFile.bucket,
          is_deleted: mediaFile.is_deleted,
          
          link_id: item.id,
          project_id: item.project_id || '',
          project_name: project?.name || 'Sin proyecto',
          site_log_id: item.site_log_id || '',
          organization_id: item.organization_id,
          visibility: item.visibility || 'organization',
          description: item.description || null,
          category: item.category || null,
          is_cover: false,
          position: item.position || null,
          created_at: item.created_at,
          created_by: item.created_by || 'Desconocido',
          
          site_log: {
            id: siteLog.id,
            date: siteLog.log_date,
            description: siteLog.comments || null,
            type_name: siteLog.site_log_types?.name || 'Sin tipo'
          }
        };
      })
    );

    return files;

  } catch (error) {
    console.error('Error fetching sitelog gallery files:', error);
    throw error;
  }
}
