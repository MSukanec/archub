import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomModalLayout } from '@/components/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/modal/CustomModalFooter';
import { useCreateKanbanBoard, useUpdateKanbanBoard } from '@/hooks/use-kanban';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useKanbanStore } from '@/stores/kanbanStore';
import { toast } from '@/hooks/use-toast';

const boardSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
});

type BoardFormData = z.infer<typeof boardSchema>;

interface NewBoardModalProps {
  open: boolean;
  onClose: () => void;
  board?: any;
  isEditing?: boolean;
}

export function NewBoardModal({ open, onClose, board, isEditing = false }: NewBoardModalProps) {
  const { data: userData } = useCurrentUser();
  const { setCurrentBoardId } = useKanbanStore();
  const createBoardMutation = useCreateKanbanBoard();
  const updateBoardMutation = useUpdateKanbanBoard();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: board?.name || '',
      description: board?.description || ''
    }
  });

  // Reset form when board changes or modal opens/closes
  useEffect(() => {
    if (open) {
      reset({
        name: board?.name || '',
        description: board?.description || ''
      });
    }
  }, [open, board, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: BoardFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la organización",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isEditing && board) {
        await updateBoardMutation.mutateAsync({
          id: board.id,
          name: data.name,
          description: data.description || undefined
        });
      } else {
        const newBoard = await createBoardMutation.mutateAsync({
          name: data.name,
          description: data.description || undefined
        });
        // Auto-select the newly created board
        setCurrentBoardId(newBoard.id);
      }

      handleClose();
    } catch (error) {
      console.error('Error saving board:', error);
      toast({
        title: "Error",
        description: isEditing ? "No se pudo actualizar el tablero" : "No se pudo crear el tablero",
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
            title={isEditing ? "Editar Tablero" : "Nuevo Tablero de Ideas"}
            description={isEditing ? "Edita la información del tablero" : "Crea un nuevo tablero para organizar tus tareas con listas y tarjetas"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <form id="board-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del tablero</Label>
                <Input 
                  id="name"
                  {...register('name')}
                  placeholder="Cosas para Hacer"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea 
                  id="description"
                  {...register('description')}
                  placeholder="Describe el propósito de este tablero..."
                  rows={3}
                />
              </div>
            </form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            form="board-form"
            saveText={isEditing ? "Actualizar Tablero" : "Crear Tablero"}
            isLoading={isSubmitting}
          />
        )
      }}
    />
  );
}