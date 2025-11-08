import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  listContactAttachments, 
  createContactAttachment, 
  deleteContactAttachment, 
  setContactAvatarFromAttachment,
  ContactAttachment 
} from '@/services/contactAttachments';
import { useToast } from '@/hooks/use-toast';

export function useContactAttachments(contactId: string) {
  return useQuery({
    queryKey: ['contact-attachments', contactId],
    queryFn: () => listContactAttachments(contactId),
    enabled: !!contactId,
  });
}

export function useCreateContactAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createContactAttachment,
    onSuccess: (data) => {
      // Invalidar cache de adjuntos
      queryClient.invalidateQueries({ queryKey: ['contact-attachments', data.contact_id] });
      // Invalidar cache del contacto individual
      queryClient.invalidateQueries({ queryKey: ['contact', data.contact_id] });
      // Invalidar cache de la lista de contactos (para actualizar attachments_count)
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      
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

export function useDeleteContactAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteContactAttachment,
    onSuccess: (_, attachmentId) => {
      // Invalidar todos los caches relacionados
      queryClient.invalidateQueries({ queryKey: ['contact-attachments'] });
      queryClient.invalidateQueries({ queryKey: ['contact'] });
      // Invalidar cache de la lista de contactos (para actualizar attachments_count)
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      
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

export function useSetContactAvatar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ contactId, attachmentId }: { contactId: string; attachmentId: string }) =>
      setContactAvatarFromAttachment(contactId, attachmentId),
    onSuccess: (_, { contactId }) => {
      // Invalidar cache del contacto específico
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
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