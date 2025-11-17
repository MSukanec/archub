import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadMediaFile } from '../services/uploadMediaFile';
import { QUERY_KEYS } from '../constants';

/**
 * Hook para subir un archivo de media.
 * 
 * Sube el archivo a storage, crea el registro en base de datos,
 * y actualiza las queries de archivos.
 * 
 * @returns React Query mutation para subir archivos
 */
export function useUploadMediaFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMediaFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GALLERY_FILES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DOCUMENT_FILES] });
    }
  });
}
