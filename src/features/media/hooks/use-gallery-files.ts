import { useQuery } from '@tanstack/react-query';
import { getGalleryFiles } from '../services/getGalleryFiles';
import { QUERY_KEYS } from '../constants';

/**
 * Hook para obtener archivos de galería.
 * 
 * Obtiene todos los archivos de media (imágenes, videos) para
 * la organización y proyecto actual.
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
    queryFn: () => getGalleryFiles(organizationId, projectId),
    enabled: !!organizationId
  });
}
