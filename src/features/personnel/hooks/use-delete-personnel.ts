import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePersonnel } from '../services';
import { PERSONNEL_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';

export function useDeletePersonnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personnelId, organizationId }: { personnelId: string; organizationId: string }) =>
      deletePersonnel(personnelId, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PERSONNEL_QUERY_KEYS.all,
      });
      toast({
        title: 'Personal eliminado',
        description: 'El personal ha sido eliminado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error deleting personnel:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el personal',
        variant: 'destructive',
      });
    },
  });
}
