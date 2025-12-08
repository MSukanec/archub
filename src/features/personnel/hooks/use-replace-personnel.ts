import { useMutation, useQueryClient } from '@tanstack/react-query';
import { replacePersonnel } from '../services/replacePersonnel';
import { PERSONNEL_QUERY_KEYS } from '../constants';
import { useToast } from '@/hooks/use-toast';

export function useReplacePersonnel(organizationId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ oldId, newId }: { oldId: string; newId: string }) => {
      if (!organizationId) throw new Error('Organization ID is required');
      return replacePersonnel(oldId, newId, organizationId);
    },
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
        title: 'Personal reemplazado',
        description: 'Los datos fueron migrados correctamente',
      });
    },
    onError: (error) => {
      console.error('Error replacing personnel:', error);
      toast({
        title: 'Error',
        description: 'No se pudo reemplazar el personal',
        variant: 'destructive',
      });
    },
  });
}
