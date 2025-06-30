import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateKanbanCard } from '@/hooks/use-kanban';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useCurrentUser } from '@/hooks/use-current-user';

const cardSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

interface NewCardModalProps {
  listId: string;
  open: boolean;
  onClose: () => void;
}

export function NewCardModal({ listId, open, onClose }: NewCardModalProps) {
  const { data: userData } = useCurrentUser();
  const { data: members = [] } = useOrganizationMembers(userData?.organization?.id);
  const createCardMutation = useCreateKanbanCard();

  const form = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      title: '',
      description: '',
      assigned_to: undefined,
      due_date: '',
    },
  });

  const onSubmit = async (data: CardFormData) => {
    try {
      await createCardMutation.mutateAsync({
        list_id: listId,
        title: data.title,
        description: data.description || undefined,
        assigned_to: data.assigned_to || undefined,
        due_date: data.due_date || undefined,
      });
      
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title="Nueva Tarjeta"
            description="Crear una nueva tarjeta en la lista"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título de la tarjeta..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción de la tarjeta..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Assigned To */}
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignar a</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar miembro..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Sin asignar</SelectItem>
                          {members.map((member) => (
                            <SelectItem key={member.user_id} value={member.user_id}>
                              {member.users?.full_name || member.users?.email || 'Usuario'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha límite</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={form.handleSubmit(onSubmit)}
            saveText="Crear Tarjeta"
            saveDisabled={createCardMutation.isPending}
            saveLoading={createCardMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  );
}