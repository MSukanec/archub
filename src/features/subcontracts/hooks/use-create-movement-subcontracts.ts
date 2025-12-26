import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMovementSubcontracts, type SubcontractItem } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
export function useCreateMovementSubcontracts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      movementId: string;
      subcontracts: SubcontractItem[];
    }) => createMovementSubcontracts(data.movementId, data.subcontracts),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.movementSubcontracts(variables.movementId) 
      });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast({
        title: 'Subcontratos asignados',
        description: 'Los subcontratos han sido asignados al movimiento correctamente',
      });
    },
    onError: (error) => {
      console.error('Error creating movement subcontracts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron asignar los subcontratos al movimiento',
      });
    },
  });
}
