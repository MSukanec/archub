/**
 * Use Create Material Category Hook
 * 
 * React Query mutation para crear categorías de materiales.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMaterialCategory } from '../services/createMaterialCategory';
import { MATERIALS_QUERY_KEYS } from '../../constants';
import { toast } from '@/hooks/use-toast';
import type { NewMaterialCategoryData } from '../../types';

export function useCreateMaterialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewMaterialCategoryData) => createMaterialCategory(data),
    onSuccess: (_, variables) => {
      // Invalidate legacy key for backward compatibility
      queryClient.invalidateQueries({ queryKey: ['material-categories'], exact: false });
      
      // Invalidate materials queries that depend on categories
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.lists(), exact: false });
      
      // Invalidate org-scoped key using organization_id from mutation payload
      if (variables.organization_id) {
        queryClient.invalidateQueries({ 
          queryKey: MATERIALS_QUERY_KEYS.categories(variables.organization_id) 
        });
      }
      
      toast({
        title: "Categoría creada",
        description: "La categoría de material se ha creado exitosamente.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('Error creating material category:', error);

      let errorMessage = "No se pudo crear la categoría de material.";

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
