import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSubcontractBid } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';

export function useDeleteSubcontractBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bidId: string) => deleteSubcontractBid(bidId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.all 
      });
      toast({
        title: "Oferta eliminada",
        description: "La oferta ha sido eliminada correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deleting bid:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la oferta",
        variant: "destructive",
      });
    },
  });
}
