/**
 * Use Delete Material Hook
 * 
 * React Query mutation para eliminar un material.
 * Applies dual-cache invalidation strategy: invalidates both legacy and feature-based query keys.
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
      // Comprehensive cache invalidation to prevent stale data
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.lists(), exact: false });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.details(), exact: false });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.taskMaterials() });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.materialView() });
      
      // Invalidate all construction-materials queries across all projects
      queryClient.invalidateQueries({ queryKey: ['construction-materials'], exact: false });
      
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
