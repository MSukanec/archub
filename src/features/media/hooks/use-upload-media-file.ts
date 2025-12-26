import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadMediaFileV2 } from '../services/uploadMediaFileV2';
import { QUERY_KEYS } from '../constants';
/**
 * Hook para subir un archivo de media usando nueva arquitectura (media_files + media_links).
 * 
 * Sube el archivo a storage, crea registros en media_files y media_links,
 * y actualiza las queries de archivos.
 * 
 * @returns React Query mutation para subir archivos
 */
export function useUploadMediaFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadMediaFileV2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GALLERY_FILES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DOCUMENT_FILES] });
    }
  });
}
