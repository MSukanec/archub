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
import { useCreateKanbanList } from '@/hooks/use-kanban';
import { toast } from '@/hooks/use-toast';

const listSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  color: z.string().optional(),
});

type ListFormData = z.infer<typeof listSchema>;

interface NewListModalProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
}

export function NewListModal({ open, onClose, boardId }: NewListModalProps) {
  const createListMutation = useCreateKanbanList();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: '',
      color: ''
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: ListFormData) => {
    try {
      await createListMutation.mutateAsync({
        board_id: boardId,
        name: data.name,
        color: data.color || undefined
      });

      toast({
        title: "Éxito",
        description: "Lista creada correctamente"
      });

      handleClose();
    } catch (error) {
      console.error('Error creating list:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la lista",
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
            title="Nueva Lista"
            description="Crea una nueva lista para organizar tarjetas en este tablero"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody>
            <form id="list-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
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

                <div className="col-span-1">
                  <Label htmlFor="color">Color (opcional)</Label>
                  <Input 
                    id="color"
                    type="color"
                    {...register('color')}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            form="list-form"
            saveText="Crear Lista"
            isLoading={isSubmitting}
          />
        )
      }}
    />
  );
}