import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteGeneralCost } from '../services/deleteGeneralCost';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';

export function useDeleteGeneralCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (generalCostId: string) => deleteGeneralCost(generalCostId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.lists() });
      
      toast({
        title: 'Gasto general eliminado',
        description: 'El gasto general ha sido eliminado correctamente.',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting general cost:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el gasto general',
        variant: 'destructive',
      });
    },
  });
}
