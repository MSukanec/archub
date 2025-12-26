/**
 * Use Update Material Hook
 * 
 * React Query mutation para actualizar un material existente.
 * Applies dual-cache invalidation strategy: invalidates both legacy and feature-based query keys.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMaterial } from '../services/updateMaterial';
import { MATERIALS_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
import type { UpdateMaterialData } from '../types';
export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaterialData }) => 
      updateMaterial(id, data),
    onSuccess: (_, variables) => {
      // Comprehensive cache invalidation to prevent stale data
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.lists(), exact: false });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.details(), exact: false });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.taskMaterials() });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.materialView() });
      
      // Invalidate all construction-materials queries across all projects
      queryClient.invalidateQueries({ queryKey: ['construction-materials'], exact: false });
      
      // Invalidate org-scoped key using organization_id from mutation payload
      if (variables.data.organization_id) {
        queryClient.invalidateQueries({ 
          queryKey: MATERIALS_QUERY_KEYS.list(variables.data.organization_id) 
        });
      }
      
      toast({
        title: "Material actualizado",
        description: "El material se ha actualizado exitosamente.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error updating material:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el material.",
        variant: "destructive",
      });
    },
  });
}
