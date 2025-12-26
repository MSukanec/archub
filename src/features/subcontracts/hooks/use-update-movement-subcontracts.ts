import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMovementSubcontracts, type SubcontractItem } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
export function useUpdateMovementSubcontracts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      movementId: string;
      subcontracts: SubcontractItem[];
    }) => updateMovementSubcontracts(data.movementId, data.subcontracts),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.movementSubcontracts(variables.movementId) 
      });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast({
        title: 'Subcontratos actualizados',
        description: 'Los subcontratos del movimiento han sido actualizados correctamente',
      });
    },
    onError: (error) => {
      console.error('Error updating movement subcontracts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron actualizar los subcontratos del movimiento',
      });
    },
  });
}
