import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { deleteClientRole } from '@/features/clients/services/clientRoles';
import { CLIENT_QUERY_KEYS } from '@/features/clients/constants';

export function useDeleteClientRole(organizationId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (roleId: string) =>
      deleteClientRole(roleId, organizationId || ''),
    onSuccess: () => {
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: CLIENT_QUERY_KEYS.roles(organizationId),
        });
        queryClient.invalidateQueries({
          queryKey: CLIENT_QUERY_KEYS.all,
        });
      }
      toast({
        title: 'Rol eliminado',
        description: 'El rol de cliente fue eliminado correctamente',
      });
    },
    onError: (error) => {
      console.error('Error deleting client role:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el rol de cliente',
        variant: 'destructive',
      });
    },
  });
}
