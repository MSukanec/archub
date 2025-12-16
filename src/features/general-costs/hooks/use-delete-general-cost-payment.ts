import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteGeneralCostPayment } from '../services/deleteGeneralCostPayment';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';

interface DeleteGeneralCostPaymentParams {
  id: string;
  organizationId: string;
}

export function useDeleteGeneralCostPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, organizationId }: DeleteGeneralCostPaymentParams) =>
      deleteGeneralCostPayment(id, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.payments() });
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.monthlySummary() });
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.byCategory() });
      queryClient.invalidateQueries({ queryKey: ['unified-movements'] });
      queryClient.invalidateQueries({ queryKey: ['unified-movements-stats'] });
      
      toast({
        title: 'Pago eliminado',
        description: 'El pago del gasto general ha sido eliminado correctamente.',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting general cost payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el pago',
        variant: 'destructive',
      });
    },
  });
}
