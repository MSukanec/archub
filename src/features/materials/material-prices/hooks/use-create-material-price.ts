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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-prices'] });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.taskMaterials() });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.materialView() });
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
