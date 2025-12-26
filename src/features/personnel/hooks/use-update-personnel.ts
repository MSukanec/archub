import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePersonnel, type UpdatePersonnelData } from '../services';
import { PERSONNEL_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';

export function useUpdatePersonnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personnelId, data }: { personnelId: string; data: UpdatePersonnelData }) =>
      updatePersonnel(personnelId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: PERSONNEL_QUERY_KEYS.detail(data.id),
      });
      toast({
        title: 'Personal actualizado',
        description: 'El personal ha sido actualizado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error updating personnel:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el personal',
        variant: 'destructive',
      });
    },
  });
}
