import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMediaFileV2 } from '../services/deleteMediaFileV2';
import { QUERY_KEYS } from '../constants';
import type { MediaFileWithLink } from '../types';

interface DeleteContext {
  previousData: Map<string, MediaFileWithLink[]>;
}

/**
 * Hook para eliminar un archivo de media usando nueva arquitectura (media_files + media_links).
 * 
 * Implementa optimistic updates para eliminación instantánea del UI.
 * El archivo desaparece inmediatamente y se sincroniza en background.
 * 
 * @returns React Query mutation para eliminar archivos
 */
export function useDeleteMediaFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => {
      console.log('[useDeleteMediaFile] Deleting linkId:', linkId);
      return deleteMediaFileV2(linkId);
    },
    
    // OPTIMISTIC UPDATE: Remove item from cache IMMEDIATELY
    onMutate: async (linkId: string): Promise<DeleteContext> => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.GALLERY_FILES] });
      
      // Store previous data for rollback
      const previousData = new Map<string, MediaFileWithLink[]>();
      
      // Get all gallery queries from cache and update them optimistically
      const queryCache = queryClient.getQueryCache();
      const galleryQueries = queryCache.findAll({ 
        queryKey: [QUERY_KEYS.GALLERY_FILES],
        type: 'active'
      });
      
      for (const query of galleryQueries) {
        const queryKey = query.queryKey as string[];
        const keyString = JSON.stringify(queryKey);
        const data = query.state.data as MediaFileWithLink[] | undefined;
        
        if (data && Array.isArray(data)) {
          // Save previous state
          previousData.set(keyString, [...data]);
          
          // Optimistically remove the item
          const newData = data.filter(
            (file) => file.link_id !== linkId && file.id !== linkId
          );
          
          queryClient.setQueryData(queryKey, newData);
        }
      }
      
      return { previousData };
    },
    
    // ROLLBACK: Restore previous state if mutation fails
    onError: (error, linkId, context) => {
      console.error('[useDeleteMediaFile] Error, rolling back:', error);
      
      if (context?.previousData) {
        for (const [keyString, data] of context.previousData) {
          const queryKey = JSON.parse(keyString);
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    
    // SYNC: Refresh in background after mutation completes (success or error)
    onSettled: () => {
      // Background refetch to ensure data consistency
      // Use refetchType: 'none' to avoid blocking - data is already correct
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.GALLERY_FILES],
        refetchType: 'none'
      });
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.DOCUMENT_FILES],
        refetchType: 'none'
      });
    }
  });
}
