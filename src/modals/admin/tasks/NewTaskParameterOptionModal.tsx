import { useState, useEffect } from 'react';
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

import { useCreateTaskParameterOption, useUpdateTaskParameterOption, TaskParameterOption } from '@/hooks/use-task-parameters-admin';

const taskParameterOptionSchema = z.object({
  parameter_id: z.string().min(1, 'Parameter ID es requerido'),
  value: z.string().min(1, 'El nombre (código) es requerido'),
  label: z.string().min(1, 'La etiqueta (visible) es requerida'),
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
  parameterLabel
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
        value: option.name,
        label: option.label,
      });
    } else if (!option && open) {
      form.reset({
        parameter_id: parameterId,
        value: '',
        label: '',
      });
    }
  }, [option, open, form, parameterId]);

  const onSubmit = async (data: TaskParameterOptionFormData) => {
    setIsSubmitting(true);
    
    try {
      if (option) {
        await updateMutation.mutateAsync({
          id: option.id,
          parameter_id: data.parameter_id,
          name: data.value, // sending value as name to database
          label: data.label,
        });
      } else {
        await createMutation.mutateAsync({
          parameter_id: data.parameter_id,
          name: data.value, // sending value as name to database
          label: data.label,
        });
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
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="option-form">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Nombre (código)</FormLabel>
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

                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Etiqueta (visible)</FormLabel>
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
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <div className="p-2 border-t border-[var(--card-border)] mt-auto">
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="w-1/4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="option-form"
                className="w-3/4"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : (option ? "Actualizar" : "Guardar")}
              </Button>
            </div>
          </div>
        ),
      }}
    </CustomModalLayout>
  );
}