import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageSquarePlus } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const conversationSchema = z.object({
  user_id: z.string().min(1, 'Debes seleccionar un usuario'),
  message: z.string().min(1, 'El mensaje es requerido').max(2000, 'El mensaje es muy largo (máximo 2000 caracteres)'),
});

type ConversationFormData = z.infer<typeof conversationSchema>;

interface SupportConversationStartModalProps {
  modalData?: {};
  onClose: () => void;
}

export function SupportConversationStartModal({ onClose }: SupportConversationStartModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);

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

  const handleClose = () => {
    form.reset();
    onClose();
  };

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
      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conversación. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: ConversationFormData) => {
    setIsLoading(true);
    try {
      await createConversationMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensaje</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Escribe tu mensaje aquí..."
                  className="min-h-[120px] resize-none"
                  maxLength={2000}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title="Iniciar Conversación"
      description="Envía un mensaje a un usuario para iniciar una nueva conversación de soporte."
      icon={MessageSquarePlus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel="Enviar Mensaje"
      onRightClick={form.handleSubmit(onSubmit)}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div></div>}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
    />
  );
}
