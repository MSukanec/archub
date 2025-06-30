import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { useCreateKanbanBoard } from '@/hooks/use-kanban';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from '@/hooks/use-toast';

const boardSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
});

type BoardFormData = z.infer<typeof boardSchema>;

interface NewBoardModalProps {
  open: boolean;
  onClose: () => void;
  editingBoard?: any;
}

export function NewBoardModal({ open, onClose, editingBoard }: NewBoardModalProps) {
  const { data: userData } = useCurrentUser();
  const createBoardMutation = useCreateKanbanBoard();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

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
      await createBoardMutation.mutateAsync({
        name: data.name,
        description: data.description || undefined
      });

      toast({
        title: "Éxito",
        description: "Tablero creado correctamente"
      });

      handleClose();
    } catch (error) {
      console.error('Error creating board:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el tablero",
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
            title="Nuevo Tablero de Ideas"
            description="Crea un nuevo tablero para organizar tus tareas con listas y tarjetas"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody>
            <form id="board-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
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

                <div className="col-span-1">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea 
                    id="description"
                    {...register('description')}
                    placeholder="Describe el propósito de este tablero..."
                    rows={3}
                  />
                </div>
              </div>
            </form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            form="board-form"
            saveText="Crear Tablero"
            isLoading={isSubmitting}
          />
        )
      }}
    />
  );
}