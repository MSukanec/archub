import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadContactAttachment } from '../services';
import { CONTACT_ATTACHMENT_QUERY_KEYS, CONTACT_QUERY_KEYS } from '../constants';
import { useToast } from '@/hooks/use-toast';
import type { ContactAttachmentInput } from '../types';

interface CreateAttachmentParams {
  contactId: string;
  file: File;
  category: 'dni_front' | 'dni_back' | 'document' | 'photo' | 'other';
  createdBy: string;
  metadata?: any;
}

export function useCreateContactAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ contactId, file, category, createdBy, metadata }: CreateAttachmentParams) => {
      const input: ContactAttachmentInput = {
        file,
        category,
        metadata,
      };
      return uploadContactAttachment(contactId, input, createdBy);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CONTACT_ATTACHMENT_QUERY_KEYS.list(data.contact_id) });
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.all });
      
      toast({
        title: "Éxito",
        description: "Adjunto subido correctamente",
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
