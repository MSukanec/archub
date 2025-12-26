import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePersonnel } from '../services';
import { PERSONNEL_QUERY_KEYS } from '../constants';
import { useToast } from '@/hooks/use-toast';

export function useDeletePersonnel(organizationId: string | null = null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ personnelId, organizationId: orgId }: { personnelId: string; organizationId: string }) =>
      deletePersonnel(personnelId, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PERSONNEL_QUERY_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey: ['personnel-payments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['personnel-attendance'],
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
