import { supabase } from '@/lib/supabase';
export interface SiteLogFile {
  id: string;
  file_url: string | null;
  signed_url?: string;
  file_name: string;
  file_type: 'image'| 'video'| 'pdf'| 'doc'| 'other';
  file_size: number;
  file_path: string;
  bucket: string;
  link_id: string;
  description: string | null;
  category: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}
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
 * Obtiene los archivos multimedia de una bitácora específica.
 * 
 * Usa la nueva arquitectura unificada (media_links + media_files).
 * 
 * CRÍTICO: Filtra por site_log_id Y organization_id para prevenir data leaks.
 * 
 * @param siteLogId - ID de la bitácora
 * @param organizationId - ID de la organización
 * @returns Array de archivos multimedia, o array vacío
 * @throws {Error} Si falla la query de Supabase
 */
export async function getSiteLogFiles(siteLogId: string, organizationId: string): Promise<SiteLogFile[]> {
  if (!supabase || !siteLogId || !organizationId) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('media_links')
      .select(`
        id,
        description,
        category,
        metadata,
        created_at,
        media_files!inner (
          id,
          file_url,
          file_name,
          file_type,
          file_size,
          file_path,
          bucket,
          is_deleted
        )
      `)
      .eq('site_log_id', siteLogId)
      .eq('organization_id', organizationId)
      .eq('media_files.is_deleted', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    if (!data) return [];
    const filteredData = data.filter((item: any) => {
      const mediaFile = Array.isArray(item.media_files) ? item.media_files[0] : item.media_files;
      return mediaFile && !mediaFile.is_deleted;
    });
    const files: SiteLogFile[] = await Promise.all(
      filteredData.map(async (item: any) => {
        const mediaFile = Array.isArray(item.media_files) ? item.media_files[0] : item.media_files;
        
        let displayUrl = mediaFile.file_url;
        
        if (mediaFile.bucket === 'private-assets'&& mediaFile.file_path) {
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
          link_id: item.id,
          description: item.description,
          category: item.category,
          metadata: item.metadata,
          created_at: item.created_at
        };
      })
    );
    return files;
  } catch (error) {
    console.error('Error fetching sitelog files:', error);
    throw error;
  }
}
