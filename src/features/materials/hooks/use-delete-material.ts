/**
 * Use Delete Material Hook
 * 
 * React Query mutation para eliminar un material.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMaterial } from '../services/deleteMaterial';
import { MATERIALS_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';

export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.all });
      
      toast({
        title: "Material eliminado",
        description: "El material se ha eliminado exitosamente.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting material:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el material.",
        variant: "destructive",
      });
    },
  });
}
