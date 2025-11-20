import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteContactAttachment } from '../services';
import { CONTACT_ATTACHMENT_QUERY_KEYS, CONTACT_QUERY_KEYS } from '../constants';
import { useToast } from '@/hooks/use-toast';

export function useDeleteContactAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (attachmentId: string) => deleteContactAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_ATTACHMENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.all });
      
      toast({
        title: "Éxito",
        description: "Adjunto eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
