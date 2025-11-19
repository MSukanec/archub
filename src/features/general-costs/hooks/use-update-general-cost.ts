import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGeneralCost } from '../services/updateGeneralCost';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
import type { InsertGeneralCost } from '../types';

export function useUpdateGeneralCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ generalCostId, generalCost }: { 
      generalCostId: string; 
      generalCost: Partial<InsertGeneralCost> 
    }) => updateGeneralCost(generalCostId, generalCost),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.detail(data.id) });
      
      toast({
        title: 'Gasto general actualizado',
        description: `El gasto general "${data.name}" ha sido actualizado correctamente.`,
      });
    },
    onError: (error: any) => {
      console.error('Error updating general cost:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el gasto general',
        variant: 'destructive',
      });
    },
  });
}
