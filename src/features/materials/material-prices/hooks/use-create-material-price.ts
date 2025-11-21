/**
 * Use Create Material Price Hook
 * 
 * React Query mutation para crear precios de materiales.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMaterialPrice } from '../services/createMaterialPrice';
import { MATERIALS_QUERY_KEYS } from '../../constants';
import { toast } from '@/hooks/use-toast';
import type { InsertOrganizationMaterialPrice } from '../../../../../shared/schema';

export function useCreateMaterialPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertOrganizationMaterialPrice) => createMaterialPrice(data),
    onSuccess: (_, variables) => {
      // Invalidate legacy key for backward compatibility
      queryClient.invalidateQueries({ queryKey: ['material-prices'], exact: false });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.lists(), exact: false });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.taskMaterials() });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.materialView() });
      
      // Invalidate org-scoped keys using organization_id from mutation payload
      if (variables.organization_id) {
        queryClient.invalidateQueries({ 
          queryKey: MATERIALS_QUERY_KEYS.list(variables.organization_id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: MATERIALS_QUERY_KEYS.prices(variables.organization_id) 
        });
      }
      
      toast({
        title: 'Precio creado',
        description: 'El precio del material se ha guardado exitosamente.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Error creating material price:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el precio del material.',
        variant: 'destructive',
      });
    },
  });
}
