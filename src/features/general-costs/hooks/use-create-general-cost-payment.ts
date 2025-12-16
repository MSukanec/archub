import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGeneralCostPayment } from '../services/createGeneralCostPayment';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
import type { InsertGeneralCostPayment } from '../types';

export function useCreateGeneralCostPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payment: InsertGeneralCostPayment) => createGeneralCostPayment(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.payments() });
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.monthlySummary() });
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.byCategory() });
      queryClient.invalidateQueries({ queryKey: ['unified-movements'] });
      queryClient.invalidateQueries({ queryKey: ['unified-movements-stats'] });
      
      toast({
        title: 'Pago registrado',
        description: 'El pago del gasto general ha sido registrado correctamente.',
      });
    },
    onError: (error: any) => {
      console.error('Error creating general cost payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el pago',
        variant: 'destructive',
      });
    },
  });
}
