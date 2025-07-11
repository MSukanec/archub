import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { useCreateKanbanList, useUpdateKanbanList, type KanbanList } from '@/hooks/use-kanban';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from '@/hooks/use-toast';
import UserSelector from '@/components/ui-custom/misc/UserSelector';

const listSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  created_by: z.string().min(1, 'El creador es requerido'),
});

type ListFormData = z.infer<typeof listSchema>;

interface NewListModalProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  editingList?: KanbanList;
}

export function NewListModal({ open, onClose, boardId, editingList }: NewListModalProps) {
  const createListMutation = useCreateKanbanList();
  const updateListMutation = useUpdateKanbanList();
  const isEditing = !!editingList;
  
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: members = [] } = useOrganizationMembers(organizationId);
  
  // Convert members to users format for UserSelector
  const users = members.map(member => ({
    id: member.id, // Use member.id for created_by field
    full_name: member.user?.full_name || member.user?.email || 'Usuario',
    email: member.user?.email || '',
    avatar_url: member.user?.avatar_url
  }));
  
  // Find current user's member ID for default selection
  const currentUserMember = members.find(member => member.user_id === userData?.user?.id);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: editingList?.name || '',
      created_by: editingList?.created_by || currentUserMember?.id || ''
    }
  });

  const watchedCreatedBy = watch('created_by');

  // Set default created_by when modal opens and members are loaded
  React.useEffect(() => {
    if (members.length > 0) {
      if (editingList && editingList.created_by) {
        // Set the creator from the editing list
        setValue('created_by', editingList.created_by);
      } else if (currentUserMember && !watchedCreatedBy) {
        // Set current user as default for new lists
        setValue('created_by', currentUserMember.id);
      }
    }
  }, [members, currentUserMember, editingList, watchedCreatedBy, setValue]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: ListFormData) => {
    try {
      if (isEditing && editingList) {
        await updateListMutation.mutateAsync({
          id: editingList.id,
          board_id: boardId,
          name: data.name,
          created_by: data.created_by
        });
      } else {
        await createListMutation.mutateAsync({
          board_id: boardId,
          name: data.name,
          created_by: data.created_by
        });
      }

      handleClose();
    } catch (error) {
      console.error('Error saving list:', error);
      toast({
        title: "Error",
        description: isEditing ? "No se pudo actualizar la lista" : "No se pudo crear la lista",
        variant: "destructive"
      });
    }
  };

  return (
    <CustomModalLayout
      open={open}
      onClose={handleClose}
      children={{
        header: (
          <CustomModalHeader
            title={isEditing ? "Editar Lista" : "Nueva Lista"}
            description={isEditing ? "Modifica el nombre de esta lista" : "Crea una nueva lista para organizar tarjetas en este tablero"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <form id="list-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la lista</Label>
                <Input 
                  id="name"
                  {...register('name')}
                  placeholder="Por Hacer"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="created_by">Creador</Label>
                <UserSelector
                  users={users}
                  value={watchedCreatedBy}
                  onChange={(value) => setValue('created_by', value)}
                  placeholder="Seleccionar creador"
                />
                {errors.created_by && (
                  <p className="text-sm text-red-500 mt-1">{errors.created_by.message}</p>
                )}
              </div>
            </form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            form="list-form"
            saveText={isEditing ? "Actualizar Lista" : "Crear Lista"}
            isLoading={isSubmitting}
          />
        )
      }}
    />
  );
}