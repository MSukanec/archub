import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMediaFile } from '../services/deleteMediaFile';
import { QUERY_KEYS } from '../constants';

/**
 * Hook para eliminar un archivo de media.
 * 
 * Elimina el archivo de storage y base de datos, luego invalida
 * las queries de archivos para refrescar la UI.
 * 
 * @returns React Query mutation para eliminar archivos
 */
export function useDeleteMediaFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMediaFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GALLERY_FILES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DOCUMENT_FILES] });
    }
  });
}
