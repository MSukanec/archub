import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { CustomModalLayout } from '@/components/modal/legacy/CustomModalLayout';
import { CustomModalHeader } from '@/components/modal/legacy/CustomModalHeader';
import { CustomModalBody } from '@/components/modal/legacy/CustomModalBody';
import { CustomModalFooter } from '@/components/modal/legacy/CustomModalFooter';

import { useCreateTaskGroup, useUpdateTaskGroup } from '@/hooks/use-task-groups';

const taskGroupSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida'),
});

type TaskGroupFormData = z.infer<typeof taskGroupSchema>;

export interface TaskGroup {
  id: string;
  name: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

interface NewTaskGroupModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  taskGroup?: TaskGroup;
}

export function NewTaskGroupModal({ 
  open, 
  onClose, 
  categoryId,
  categoryName,
  taskGroup 
}: NewTaskGroupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createMutation = useCreateTaskGroup();
  const updateMutation = useUpdateTaskGroup();

  const form = useForm<TaskGroupFormData>({
    resolver: zodResolver(taskGroupSchema),
    defaultValues: {
      name: '',
      category_id: categoryId,
    },
  });

  // Reset form when modal opens/closes or taskGroup changes
  useEffect(() => {
    if (taskGroup && open) {
      form.reset({
        name: taskGroup.name,
        category_id: taskGroup.category_id,
      });
    } else if (!taskGroup && open) {
      form.reset({
        name: '',
        category_id: categoryId,
      });
    }
  }, [taskGroup, open, form, categoryId]);

  const onSubmit = async (data: TaskGroupFormData) => {
    setIsSubmitting(true);
    
    try {
      if (taskGroup) {
        // Editing existing task group
        await updateMutation.mutateAsync({
          id: taskGroup.id,
          ...data,
        });
      } else {
        // Creating new task group

        await createMutation.mutateAsync(data);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error saving task group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModalLayout 
      open={open} 
      onClose={handleClose}
      children={{
        header: (
          <CustomModalHeader 
            title={taskGroup ? "Editar Grupo de Tareas" : "Nuevo Grupo de Tareas"}
            onClose={handleClose}
          />
        ),
        body: (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CustomModalBody columns={1}>
                {/* Category context */}
                <div className="col-span-1 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Categoría: <span className="font-medium text-foreground">{categoryName}</span>
                  </p>
                </div>

                {/* Task Group Name */}
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Grupo <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: Muros de Mampostería, Estructuras de Hormigón..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CustomModalBody>
            </form>
          </Form>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSubmit={form.handleSubmit(onSubmit)}
            cancelText="Cancelar"
            submitText={taskGroup ? "Actualizar Grupo" : "Crear Grupo"}
            isLoading={isSubmitting}
          />
        )
      }}
    />
  );
}