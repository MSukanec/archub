import React, { useEffect } from 'react';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useCreateKanbanCard } from '@/hooks/use-kanban';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { toast } from '@/hooks/use-toast';

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
  const { data: organizationMembers, isLoading: membersLoading } = useOrganizationMembers();

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
                  <Select 
                    value={watch('assigned_to')} 
                    onValueChange={(value) => setValue('assigned_to', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar miembro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {organizationMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.user_id}>
                          {member.user.full_name}
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