/**
 * Use Create Material Hook
 * 
 * React Query mutation para crear un nuevo material.
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.taskMaterials() });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.materialView() });
      
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
