import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
const conversationSchema = z.object({
  user_id: z.string().min(1, 'Debes seleccionar un usuario'),
  message: z.string().min(1, 'El mensaje es requerido').max(2000, 'El mensaje es muy largo (máximo 2000 caracteres)'),
});
export type ConversationFormData = z.infer<typeof conversationSchema>;
export interface UseSupportConversationStartFormProps {
  onClose: () => void;
}
export function useSupportConversationStartForm({ onClose }: UseSupportConversationStartFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Fetch all users for dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users-list-support'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });
  const form = useForm<ConversationFormData>({
    resolver: zodResolver(conversationSchema),
    defaultValues: {
      user_id: '',
      message: '',
    }
  });
  const createConversationMutation = useMutation({
    mutationFn: async (data: ConversationFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: data.user_id,
          message: data.message,
          sender: 'admin',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-conversations'] });
      toast({
        title: 'Conversación iniciada',
        description: 'El mensaje fue enviado correctamente al usuario.'
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conversación. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });
  const onSubmit = async (data: ConversationFormData) => {
    await createConversationMutation.mutateAsync(data);
  };
  return {
    form,
    users,
    onSubmit,
    isSubmitting: createConversationMutation.isPending,
    conversationSchema,
  };
}
