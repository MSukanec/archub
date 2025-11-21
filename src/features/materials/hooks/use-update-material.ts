/**
 * Use Update Material Hook
 * 
 * React Query mutation para actualizar un material existente.
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.taskMaterials() });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.materialView() });
      
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
