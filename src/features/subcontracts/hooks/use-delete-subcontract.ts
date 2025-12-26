import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSubcontract } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
export function useDeleteSubcontract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ 
      subcontractId, 
      organizationId 
    }: { 
      subcontractId: string; 
      organizationId: string 
    }) => deleteSubcontract(subcontractId, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.all 
      });
      toast({
        title: "Subcontrato eliminado",
        description: "El subcontrato ha sido eliminado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deleting subcontract:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el subcontrato",
        variant: "destructive",
      });
    },
  });
}
