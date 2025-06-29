import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { useCreateTaskParameterOption, useUpdateTaskParameterOption, TaskParameterOption } from '@/hooks/use-task-parameters-admin';

const taskParameterOptionSchema = z.object({
  parameter_id: z.string().min(1, 'Parameter ID es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  value: z.string().min(1, 'El valor es requerido'),
});

type TaskParameterOptionFormData = z.infer<typeof taskParameterOptionSchema>;

interface NewTaskParameterOptionModalProps {
  open: boolean;
  onClose: () => void;
  option?: TaskParameterOption;
  parameterId: string;
  parameterLabel: string;
}

export function NewTaskParameterOptionModal({ 
  open, 
  onClose, 
  option,
  parameterId,
  parameterLabel,
  nextPosition
}: NewTaskParameterOptionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createMutation = useCreateTaskParameterOption();
  const updateMutation = useUpdateTaskParameterOption();

  const form = useForm<TaskParameterOptionFormData>({
    resolver: zodResolver(taskParameterOptionSchema),
    defaultValues: {
      parameter_id: parameterId,
      label: '',
      value: '',
    },
  });

  // Reset form when modal opens/closes or option changes
  useEffect(() => {
    if (option && open) {
      form.reset({
        parameter_id: option.parameter_id,
        label: option.label,
        value: option.value,
      });
    } else if (!option && open) {
      form.reset({
        parameter_id: parameterId,
        label: '',
        value: '',
      });
    }
  }, [option, open, form, parameterId]);

  const onSubmit = async (data: TaskParameterOptionFormData) => {
    setIsSubmitting(true);
    
    try {
      if (option) {
        await updateMutation.mutateAsync({
          id: option.id,
          ...data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting option:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={option ? 'Editar Opción' : 'Nueva Opción'}
            description={`${option ? 'Modifica la opción' : 'Crea una nueva opción'} para el parámetro "${parameterLabel}"`}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Etiqueta</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Madera, Metal, Hormigón..."
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Valor</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: wood, metal, concrete..."
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
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
            saveText={isSubmitting ? 'Guardando...' : option ? 'Actualizar' : 'Crear'}
            saveDisabled={isSubmitting}
          />
        ),
      }}
    </CustomModalLayout>
  );
}