import { useQuery } from '@tanstack/react-query';
import { getGalleryFilesV2 } from '../services/getGalleryFilesV2';
import { QUERY_KEYS } from '../constants';

/**
 * Hook para obtener archivos de galería usando nueva arquitectura (media_files + media_links).
 * 
 * Obtiene todos los archivos de media (imágenes, videos) para
 * la organización y proyecto actual mediante JOIN entre tablas.
 * 
 * @param organizationId - ID de la organización
 * @param projectId - ID del proyecto (opcional)
 * @returns React Query result con los archivos de galería
 */
export function useGalleryFiles(
  organizationId: string | undefined,
  projectId: string | undefined
) {
  return useQuery({
    queryKey: [QUERY_KEYS.GALLERY_FILES, organizationId, projectId],
    queryFn: () => getGalleryFilesV2(organizationId, projectId),
    enabled: !!organizationId
  });
}
