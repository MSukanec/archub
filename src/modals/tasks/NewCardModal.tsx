import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateKanbanCard } from '@/hooks/use-kanban';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from '@/hooks/use-toast';

const cardSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

interface NewCardModalProps {
  open: boolean;
  onClose: () => void;
  listId: string;
}

export function NewCardModal({ open, onClose, listId }: NewCardModalProps) {
  const createCardMutation = useCreateKanbanCard();
  const { data: userData } = useCurrentUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      title: '',
      description: '',
      assigned_to: '',
      due_date: ''
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CardFormData) => {
    try {
      await createCardMutation.mutateAsync({
        list_id: listId,
        title: data.title,
        description: data.description || undefined,
        assigned_to: data.assigned_to || undefined,
        due_date: data.due_date || undefined
      });
      
      handleClose();
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  // Get organization members for assignment
  const organizationMembers = userData?.memberships || [];

  if (!open) return null;

  return (
    <CustomModalLayout
      open={open}
      onClose={handleClose}
    >
      {{
        header: (
          <CustomModalHeader
            title="Nueva Tarjeta"
            description="Crea una nueva tarjeta para organizar tareas"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody>
            <form id="card-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="title">Título</Label>
                  <Input 
                    id="title"
                    {...register('title')}
                    placeholder="Escribir documentación"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div className="col-span-1">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea 
                    id="description"
                    {...register('description')}
                    placeholder="Detalles adicionales sobre la tarea..."
                    rows={3}
                  />
                </div>

                <div className="col-span-1">
                  <Label htmlFor="assigned_to">Asignado a (opcional)</Label>
                  <Select onValueChange={(value) => setValue('assigned_to', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar miembro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {organizationMembers.map((member) => (
                        <SelectItem key={member.organization_id} value={member.organization_id}>
                          {member.organization_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1">
                  <Label htmlFor="due_date">Fecha límite (opcional)</Label>
                  <Input 
                    id="due_date"
                    type="date"
                    {...register('due_date')}
                  />
                </div>
              </div>
            </form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSubmit={() => {
              const form = document.getElementById('card-form') as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            }}
            submitText="Crear Tarjeta"
          />
        )
      }}
    </CustomModalLayout>
  );
}