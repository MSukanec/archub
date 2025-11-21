/**
 * Use Delete Material Category Hook
 * 
 * React Query mutation para eliminar categorías de materiales.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMaterialCategory } from '../services/deleteMaterialCategory';
import { toast } from '@/hooks/use-toast';

export function useDeleteMaterialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMaterialCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      
      toast({
        title: "Categoría eliminada",
        description: "La categoría de material se ha eliminado exitosamente.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error deleting material category:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría de material.",
        variant: "destructive",
      });
    },
  });
}
