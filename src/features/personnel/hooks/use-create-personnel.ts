import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPersonnel, type CreatePersonnelData } from '../services';
import { PERSONNEL_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
export function useCreatePersonnel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePersonnelData) => createPersonnel(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: PERSONNEL_QUERY_KEYS.byProject(data.project_id),
      });
      toast({
        title: 'Personal agregado',
        description: 'El personal ha sido agregado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error creating personnel:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el personal',
        variant: 'destructive',
      });
    },
  });
}
