import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMediaFileV2 } from '../services/deleteMediaFileV2';
import { QUERY_KEYS } from '../constants';

/**
 * Hook para eliminar un archivo de media usando nueva arquitectura (media_files + media_links).
 * 
 * Elimina el link en media_links y, si no quedan más links, hace soft delete
 * en media_files y elimina el archivo físico del storage.
 * 
 * @returns React Query mutation para eliminar archivos
 */
export function useDeleteMediaFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => {
      console.log('[useDeleteMediaFile] Hook received linkId:', linkId);
      return deleteMediaFileV2(linkId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GALLERY_FILES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DOCUMENT_FILES] });
    }
  });
}
