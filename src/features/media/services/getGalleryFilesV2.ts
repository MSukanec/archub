import { apiRequest } from '@/lib/queryClient';
import type { MediaFileWithLink } from '../types';
export async function getGalleryFilesV2(
  organizationId: string | undefined,
  projectId: string | undefined
): Promise<MediaFileWithLink[]> {
  if (!organizationId) {
    return [];
  }
  const queryParams = new URLSearchParams();
  
  if (projectId) {
    queryParams.append('projectId', projectId);
  }
  
  const url = `/api/media/gallery${queryParams.toString() ? '?'+ queryParams.toString() : ''}`;
  
  console.log('[getGalleryFilesV2] Calling backend endpoint:', url);
  
  const response = await apiRequest('GET', url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch gallery files');
  }
  
  const data = await response.json();
  console.log('[getGalleryFilesV2] Primeros 2 items raw:', data?.slice?.(0, 2));
  
  if (!data || !Array.isArray(data)) {
    return [];
  }
  const files: MediaFileWithLink[] = data.map((item: any) => {
    const mediaFile = item.media_files;
    
    if (!mediaFile) {
      return null;
    }
    
    const displayUrl = item.signedUrl || mediaFile.file_url;
    
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
      project_id: item.project_id,
      project_name: item.projects?.name || 'Sin proyecto',
      site_log_id: item.site_log_id,
      movement_id: item.movement_id,
      contact_id: item.contact_id,
      course_lesson_id: item.course_lesson_id,
      general_cost_payment_id: item.general_cost_payment_id,
      client_payment_id: item.client_payment_id,
      organization_id: item.organization_id,
      visibility: item.visibility,
      description: item.description,
      category: item.category,
      is_cover: item.is_cover,
      position: item.position,
      created_at: item.created_at,
      created_by: item.created_by || 'Desconocido'
    };
  }).filter(Boolean) as MediaFileWithLink[];
  return files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
