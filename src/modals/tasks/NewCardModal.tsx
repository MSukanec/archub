import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomModalLayout } from '@/components/modal/legacy/CustomModalLayout';
import { CustomModalHeader } from '@/components/modal/legacy/CustomModalHeader';
import { CustomModalBody } from '@/components/modal/legacy/CustomModalBody';
import { CustomModalFooter } from '@/components/modal/legacy/CustomModalFooter';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateKanbanCard } from '@/hooks/use-kanban';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { toast } from '@/hooks/use-toast';
import UserSelector from '@/components/ui-custom/UserSelector';

const cardSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  created_by: z.string().min(1, 'El creador es requerido'),
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
  const organizationId = userData?.organization?.id;
  const { data: members = [] } = useOrganizationMembers(organizationId);
  
  // Convert members to users format for UserSelector
  const users = members.map(member => ({
    id: member.user_id, // Use user_id for created_by and assigned_to fields
    full_name: member.full_name || member.email || 'Usuario',
    email: member.email || '',
    avatar_url: member.avatar_url
  }));

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
      created_by: userData?.user?.id || '',
      assigned_to: '',
      due_date: ''
    }
  });

  // Set current user as default creator when modal opens
  useEffect(() => {
    if (open && userData?.user?.id) {
      setValue('created_by', userData.user.id);
    }
  }, [open, userData?.user?.id, setValue]);

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
        created_by: data.created_by,
        assigned_to: data.assigned_to || undefined,
        due_date: data.due_date || undefined
      });
      
      handleClose();
      toast({
        title: "Tarjeta creada",
        description: "La tarjeta se ha creado exitosamente"
      });
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarjeta",
        variant: "destructive"
      });
    }
  };

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
          <CustomModalBody columns={1}>
            <form id="card-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="created_by">Creador</Label>
                <UserSelector
                  users={users}
                  value={watch('created_by')}
                  onChange={(value) => setValue('created_by', value)}
                  placeholder="Seleccionar creador"
                />
                {errors.created_by && (
                  <p className="text-sm text-red-500 mt-1">{errors.created_by.message}</p>
                )}
              </div>

              <div>
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

              <div>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea 
                  id="description"
                  {...register('description')}
                  placeholder="Detalles adicionales sobre la tarea..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="assigned_to">Asignado a (opcional)</Label>
                <UserSelector
                  users={users}
                  value={watch('assigned_to')}
                  onChange={(value) => setValue('assigned_to', value)}
                  placeholder="Sin asignar"
                />
              </div>

              <div>
                <Label htmlFor="due_date">Fecha límite (opcional)</Label>
                <Input 
                  id="due_date"
                  type="date"
                  {...register('due_date')}
                />
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