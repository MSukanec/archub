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
import { Button } from '@/components/ui/button';

import { useUpdateKanbanCard } from '@/hooks/use-kanban';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { toast } from '@/hooks/use-toast';
import type { KanbanCard } from '@/hooks/use-kanban';

const cardSchema = z.object({
  created_by: z.string().min(1, 'El creador es requerido'),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

interface CardDetailsModalProps {
  open: boolean;
  onClose: () => void;
  card: KanbanCard | null;
}

export function CardDetailsModal({ open, onClose, card }: CardDetailsModalProps) {
  const updateCardMutation = useUpdateKanbanCard();
  const { data: userData } = useCurrentUser();
  const { data: organizationMembers, isLoading: membersLoading } = useOrganizationMembers(userData?.organization?.id);

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
      created_by: '',
      title: '',
      description: '',
      assigned_to: ''
    }
  });

  // Reset form when card changes or modal opens/closes
  useEffect(() => {
    if (open && card) {
      reset({
        created_by: card.created_by || '',
        title: card.title || '',
        description: card.description || '',
        assigned_to: card.assigned_to || ''
      });
    }
  }, [open, card, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };



  const onSubmit = async (data: CardFormData) => {
    if (!card) return;

    try {
      await updateCardMutation.mutateAsync({
        id: card.id,
        created_by: data.created_by,
        title: data.title,
        description: data.description || undefined,
        assigned_to: data.assigned_to || undefined,
        list_id: card.list_id
      });

      handleClose();
    } catch (error) {
      console.error('Error updating card:', error);
      toast({
        title: "Error al actualizar tarjeta",
        description: "Hubo un problema al actualizar la tarjeta",
        variant: "destructive"
      });
    }
  };

  if (!card) return null;

  return (
    <CustomModalLayout
      open={open}
      onClose={handleClose}
    >
      {{
        header: (
          <CustomModalHeader
            title="Editar Tarjeta"
            description="Modifica los detalles de la tarjeta"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <form id="card-details-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="created_by">Creador <span className="text-red-500">*</span></Label>
                  <Select 
                    value={watch('created_by')} 
                    onValueChange={(value) => setValue('created_by', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar creador" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      {organizationMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.user_id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              {member.avatar_url && (
                                <AvatarImage src={member.avatar_url} />
                              )}
                              <AvatarFallback className="text-xs">
                                {member.full_name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {member.full_name || member.email || 'Usuario'}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.created_by && <p className="text-xs text-destructive mt-1">{errors.created_by.message}</p>}
                </div>

                <div className="col-span-1">
                  <Label htmlFor="created_at">Fecha</Label>
                  <Input 
                    id="created_at"
                    value={card?.created_at ? new Date(card.created_at).toLocaleDateString('es-ES') : ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="col-span-1">
                  <Label htmlFor="title">Título <span className="text-red-500">*</span></Label>
                  <Input 
                    id="title"
                    {...register('title')}
                    placeholder="Nombre de la tarjeta"
                  />
                  {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
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
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="">Sin asignar</SelectItem>
                      {organizationMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.user_id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              {member.avatar_url && (
                                <AvatarImage src={member.avatar_url} />
                              )}
                              <AvatarFallback className="text-xs">
                                {member.full_name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {member.full_name || member.email || 'Usuario'}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


              </div>
            </form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSubmit={() => handleSubmit(onSubmit)()}
            submitText="Guardar"
            isSubmitting={isSubmitting}
          />
        )
      }}
    </CustomModalLayout>
  );
}