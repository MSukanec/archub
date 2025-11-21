/**
 * Use Update Material Price Hook
 * 
 * React Query mutation para actualizar precios de materiales.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMaterialPrice } from '../services/updateMaterialPrice';
import { MATERIALS_QUERY_KEYS } from '../../constants';
import { toast } from '@/hooks/use-toast';
import type { InsertOrganizationMaterialPrice } from '../../../../../shared/schema';

export function useUpdateMaterialPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertOrganizationMaterialPrice> }) =>
      updateMaterialPrice(id, data),
    onSuccess: (_, variables) => {
      // Invalidate legacy key for backward compatibility
      queryClient.invalidateQueries({ queryKey: ['material-prices'], exact: false });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.lists(), exact: false });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.taskMaterials() });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.materialView() });
      
      // Invalidate org-scoped keys using organization_id from mutation payload
      if (variables.data.organization_id) {
        queryClient.invalidateQueries({ 
          queryKey: MATERIALS_QUERY_KEYS.list(variables.data.organization_id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: MATERIALS_QUERY_KEYS.prices(variables.data.organization_id) 
        });
      }
      
      toast({
        title: 'Precio actualizado',
        description: 'El precio del material se ha actualizado exitosamente.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Error updating material price:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el precio del material.',
        variant: 'destructive',
      });
    },
  });
}
