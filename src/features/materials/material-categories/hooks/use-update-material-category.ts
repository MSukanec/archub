/**
 * Use Update Material Category Hook
 * 
 * React Query mutation para actualizar categorías de materiales.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMaterialCategory } from '../services/updateMaterialCategory';
import { toast } from '@/hooks/use-toast';
import type { NewMaterialCategoryData } from '../../types';

export function useUpdateMaterialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewMaterialCategoryData> }) =>
      updateMaterialCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      
      toast({
        title: "Categoría actualizada",
        description: "La categoría de material se ha actualizado exitosamente.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('Error updating material category:', error);

      let errorMessage = "No se pudo actualizar la categoría de material.";

      // Check for specific foreign key constraint error
      if (error?.code === '23503' && error?.message?.includes('material_categories_parent_id_fkey')) {
        if (error?.details?.includes('movement_concepts')) {
          errorMessage = "🔧 Error de BD: El constraint parent_id apunta incorrectamente a movement_concepts. Ve al SQL Editor en Supabase y ejecuta: DROP CONSTRAINT material_categories_parent_id_fkey CASCADE; luego ADD CONSTRAINT material_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES material_categories(id);";
        } else {
          errorMessage = "Error de configuración de base de datos: El constraint de foreign key para parent_id está mal configurado.";
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}
