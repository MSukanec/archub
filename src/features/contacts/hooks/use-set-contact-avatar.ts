import { useMutation, useQueryClient } from '@tantml:react-query';
import { setContactAvatar } from '../services';
import { CONTACT_QUERY_KEYS } from '../constants';
import { useToast } from '@/hooks/use-toast';

interface SetAvatarParams {
  contactId: string;
  attachmentId: string;
}

export function useSetContactAvatar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ contactId, attachmentId }: SetAvatarParams) =>
      setContactAvatar(contactId, attachmentId),
    onSuccess: (_, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.all });
      
      toast({
        title: "Éxito",
        description: "Avatar actualizado correctamente",
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
