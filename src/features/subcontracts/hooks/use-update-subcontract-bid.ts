import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSubcontractBid } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
import type { InsertSubcontractBid } from '../types';

export function useUpdateSubcontractBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bidId, data }: { bidId: string; data: Partial<InsertSubcontractBid> }) => 
      updateSubcontractBid(bidId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.all 
      });
      if (variables.data.subcontract_id) {
        queryClient.invalidateQueries({
          queryKey: SUBCONTRACT_QUERY_KEYS.bids(variables.data.subcontract_id)
        });
      }
      toast({
        title: "Oferta actualizada",
        description: "La oferta ha sido actualizada exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error updating bid:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la oferta",
        variant: "destructive",
      });
    },
  });
}
