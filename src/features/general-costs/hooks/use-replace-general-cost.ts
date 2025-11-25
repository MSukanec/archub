import { useMutation, useQueryClient } from '@tanstack/react-query';
import { replaceGeneralCost } from '../services/replaceGeneralCost';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';

export function useReplaceGeneralCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ oldId, newId }: { oldId: string; newId: string }) => 
      replaceGeneralCost(oldId, newId),
    onSuccess: () => {
      // Invalidate both general costs and payments queries
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.paymentsList(null) });
      
      toast({
        title: 'Concepto reemplazado',
        description: 'Los pagos fueron migrados al nuevo concepto y el anterior fue eliminado.',
      });
    },
    onError: (error: any) => {
      console.error('Error replacing general cost:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo reemplazar el concepto de gasto',
        variant: 'destructive',
      });
    },
  });
}
