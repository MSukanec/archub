import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPersonnelRate, type CreatePersonnelRateData } from '../services/createPersonnelRate';
import { PERSONNEL_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
export function useCreatePersonnelRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ personnelId, data }: { personnelId: string; data: CreatePersonnelRateData }) =>
      createPersonnelRate(personnelId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: PERSONNEL_QUERY_KEYS.rates(variables.personnelId),
      });
      queryClient.invalidateQueries({
        queryKey: PERSONNEL_QUERY_KEYS.byProject(result.personnel?.project_id || ''),
      });
      toast({
        title: 'Tarifa creada exitosamente',
        description: 'La tarifa ha sido registrada correctamente',
      });
    },
    onError: (error) => {
      console.error('Error creating personnel rate:', error);
      toast({
        title: 'Error al crear tarifa',
        description: error instanceof Error ? error.message : 'No se pudo crear la tarifa',
        variant: 'destructive',
      });
    },
  });
}
