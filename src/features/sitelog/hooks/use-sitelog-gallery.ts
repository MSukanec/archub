import { useQuery } from '@tanstack/react-query';
import { getSitelogGalleryFiles } from '../services/getSitelogGalleryFiles';
import type { SitelogGalleryFile } from '../types';
/**
 * Hook para obtener archivos multimedia de bitácoras.
 * 
 * Obtiene fotos y videos asociados a bitácoras del proyecto actual
 * usando la nueva arquitectura (media_links + media_files).
 * 
 * @param organizationId - ID de la organización
 * @param projectId - ID del proyecto (opcional)
 * @returns React Query result con archivos multimedia de bitácoras
 */
export function useSitelogGallery(
  organizationId: string | undefined,
  projectId: string | undefined
) {
  return useQuery<SitelogGalleryFile[]>({
    queryKey: ['sitelog-gallery', organizationId, projectId],
    queryFn: () => getSitelogGalleryFiles(organizationId, projectId),
    enabled: !!organizationId,
    staleTime: 0
  });
}
