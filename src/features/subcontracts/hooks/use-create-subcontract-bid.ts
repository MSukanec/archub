import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSubcontractBid } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
import type { InsertSubcontractBid } from '../types';
export function useCreateSubcontractBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertSubcontractBid) => createSubcontractBid(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SUBCONTRACT_QUERY_KEYS.bids(variables.subcontract_id)
      });
      toast({
        title: "Oferta creada",
        description: "La oferta ha sido creada exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error creating bid:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la oferta",
        variant: "destructive",
      });
    },
  });
}
