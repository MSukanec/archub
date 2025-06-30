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
import { useCreateKanbanList } from '@/hooks/use-kanban';

const listSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  color: z.string().optional(),
});

type ListFormData = z.infer<typeof listSchema>;

interface NewListModalProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
}

export function NewListModal({ boardId, open, onClose }: NewListModalProps) {
  const createListMutation = useCreateKanbanList();

  const form = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: '',
      color: '#3b82f6',
    },
  });

  const onSubmit = async (data: ListFormData) => {
    try {
      await createListMutation.mutateAsync({
        board_id: boardId,
        name: data.name,
        color: data.color || undefined,
      });
      
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const colorOptions = [
    { value: '#3b82f6', label: 'Azul' },
    { value: '#10b981', label: 'Verde' },
    { value: '#f59e0b', label: 'Amarillo' },
    { value: '#ef4444', label: 'Rojo' },
    { value: '#8b5cf6', label: 'Púrpura' },
    { value: '#6b7280', label: 'Gris' },
  ];

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title="Nueva Lista"
            description="Crear una nueva lista en el tablero"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Nombre de la lista</FormLabel>
                      <FormControl>
                        <Input placeholder="Por hacer, En progreso, Completado..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <div className="grid grid-cols-6 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            className={`h-10 w-10 rounded-lg border-2 ${
                              field.value === color.value ? 'border-primary' : 'border-muted'
                            }`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => field.onChange(color.value)}
                            title={color.label}
                          />
                        ))}
                      </div>
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
            saveText="Crear Lista"
            saveDisabled={createListMutation.isPending}
            saveLoading={createListMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  );
}