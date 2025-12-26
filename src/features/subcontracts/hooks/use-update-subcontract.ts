import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSubcontract, type UpdateSubcontractData } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
export function useUpdateSubcontract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ 
      subcontractId, 
      data 
    }: { 
      subcontractId: string; 
      data: UpdateSubcontractData 
    }) => updateSubcontract(subcontractId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.byProject(data.project_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.detail(data.id) 
      });
      toast({
        title: "Subcontrato actualizado",
        description: "El subcontrato ha sido actualizado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error updating subcontract:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el subcontrato",
        variant: "destructive",
      });
    },
  });
}
