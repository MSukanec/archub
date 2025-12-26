import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { replaceClientRole } from '@/features/clients/services/clientRoles';
import { CLIENT_QUERY_KEYS } from '@/features/clients/constants';
export function useReplaceClientRole(organizationId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ oldRoleId, newRoleId }: { oldRoleId: string; newRoleId: string }) =>
      replaceClientRole(oldRoleId, newRoleId),
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
        title: 'Rol reemplazado',
        description: 'Los clientes fueron reasignados y el rol fue eliminado correctamente',
      });
    },
    onError: (error) => {
      console.error('Error replacing client role:', error);
      toast({
        title: 'Error',
        description: 'No se pudo reemplazar el rol de cliente',
        variant: 'destructive',
      });
    },
  });
}
