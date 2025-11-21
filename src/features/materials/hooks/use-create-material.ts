/**
 * Use Create Material Hook
 * 
 * React Query mutation para crear un nuevo material.
 * Applies dual-cache invalidation strategy: invalidates both legacy and feature-based query keys.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMaterial } from '../services/createMaterial';
import { MATERIALS_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
import type { NewMaterialData } from '../types';

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewMaterialData) => createMaterial(data),
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
      if (variables.organization_id) {
        queryClient.invalidateQueries({ 
          queryKey: MATERIALS_QUERY_KEYS.list(variables.organization_id) 
        });
      }
      
      toast({
        title: "Material creado",
        description: "El material se ha creado exitosamente.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error creating material:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el material.",
        variant: "destructive",
      });
    },
  });
}
