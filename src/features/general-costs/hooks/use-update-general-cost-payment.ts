import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGeneralCostPayment } from '../services/updateGeneralCostPayment';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
import type { GeneralCostPayment } from '../types';

interface UpdateGeneralCostPaymentParams {
  id: string;
  organizationId: string;
  updates: Partial<GeneralCostPayment>;
}

export function useUpdateGeneralCostPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, organizationId, updates }: UpdateGeneralCostPaymentParams) =>
      updateGeneralCostPayment(id, organizationId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.payments() });
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.lists() });
      
      toast({
        title: 'Pago actualizado',
        description: 'El pago del gasto general ha sido actualizado correctamente.',
      });
    },
    onError: (error: any) => {
      console.error('Error updating general cost payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el pago',
        variant: 'destructive',
      });
    },
  });
}
