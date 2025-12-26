import { useMutation, useQueryClient } from '@tanstack/react-query';
import { awardSubcontract, type AwardSubcontractData } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';

export function useAwardSubcontract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      subcontractId, 
      data 
    }: { 
      subcontractId: string; 
      data: AwardSubcontractData 
    }) => awardSubcontract(subcontractId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.byProject(data.project_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.detail(data.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.bids(data.id) 
      });
      toast({
        title: "Subcontrato adjudicado",
        description: "El subcontrato ha sido adjudicado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error awarding subcontract:', error);
      toast({
        title: "Error",
        description: "No se pudo adjudicar el subcontrato",
        variant: "destructive",
      });
    },
  });
}
