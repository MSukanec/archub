import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSubcontract, type CreateSubcontractData } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';

export function useCreateSubcontract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubcontractData) => createSubcontract(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.byProject(data.project_id) 
      });
      toast({
        title: "Subcontrato creado",
        description: "El pedido de subcontrato ha sido creado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error creating subcontract:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el subcontrato",
        variant: "destructive",
      });
    },
  });
}
