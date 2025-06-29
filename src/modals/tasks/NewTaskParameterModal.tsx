import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { useCreateTaskParameter, useUpdateTaskParameter, TaskParameter } from '@/hooks/use-task-parameters-admin';

const taskParameterSchema = z.object({
  template_id: z.string().min(1, 'Template ID es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  type: z.enum(['text', 'number', 'select', 'boolean'], { 
    required_error: 'El tipo es requerido' 
  }),
  unit_id: z.string().optional(),
  is_required: z.boolean(),
  position: z.number().min(0, 'La posición debe ser mayor o igual a 0'),
});

type TaskParameterFormData = z.infer<typeof taskParameterSchema>;

interface NewTaskParameterModalProps {
  open: boolean;
  onClose: () => void;
  parameter?: TaskParameter;
  templateId: string;
  nextPosition: number;
}

export function NewTaskParameterModal({ 
  open, 
  onClose, 
  parameter,
  templateId,
  nextPosition
}: NewTaskParameterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createMutation = useCreateTaskParameter();
  const updateMutation = useUpdateTaskParameter();

  const form = useForm<TaskParameterFormData>({
    resolver: zodResolver(taskParameterSchema),
    defaultValues: {
      template_id: templateId,
      name: '',
      label: '',
      type: 'text',
      unit: '',
      is_required: false,
      position: nextPosition,
    },
  });

  // Reset form when modal opens/closes or parameter changes
  useEffect(() => {
    if (parameter && open) {
      form.reset({
        template_id: parameter.template_id,
        name: parameter.name,
        label: parameter.label,
        type: parameter.type,
        unit_id: parameter.unit_id || '',
        is_required: parameter.is_required,
        position: parameter.position,
      });
    } else if (!parameter && open) {
      form.reset({
        template_id: templateId,
        name: '',
        label: '',
        type: 'text',
        unit: '',
        is_required: false,
        position: nextPosition,
      });
    }
  }, [parameter, open, form, templateId, nextPosition]);

  const onSubmit = async (data: TaskParameterFormData) => {
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...data,
        unit: data.unit?.trim() || undefined,
      };

      if (parameter) {
        await updateMutation.mutateAsync({
          id: parameter.id,
          ...submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting parameter:', error);
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
            title={parameter ? 'Editar Parámetro' : 'Nuevo Parámetro'}
            description={parameter ? 'Modifica los datos del parámetro' : 'Crea un nuevo parámetro de plantilla'}
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
                          placeholder="Ej: Longitud, Cantidad, Material..."
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Nombre (clave)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: length, quantity, material..."
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="number">Número</SelectItem>
                          <SelectItem value="select">Selección</SelectItem>
                          <SelectItem value="boolean">Booleano</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: metros, kg, unidades..."
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posición</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Campo obligatorio</FormLabel>
                        <div className="text-xs text-muted-foreground">
                          ¿Este parámetro es requerido?
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
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
            saveText={isSubmitting ? 'Guardando...' : parameter ? 'Actualizar' : 'Crear'}
            saveDisabled={isSubmitting}
          />
        ),
      }}
    </CustomModalLayout>
  );
}