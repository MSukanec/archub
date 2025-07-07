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
import { useUnits } from '@/hooks/use-units';

const taskParameterSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  type: z.enum(['text', 'number', 'select', 'boolean'], { 
    required_error: 'El tipo es requerido' 
  }),
  unit_id: z.string().optional(),
  is_required: z.boolean(),
});

type TaskParameterFormData = z.infer<typeof taskParameterSchema>;

interface NewTaskParameterModalProps {
  open: boolean;
  onClose: () => void;
  parameter?: TaskParameter;
}

export function NewTaskParameterModal({ 
  open, 
  onClose, 
  parameter
}: NewTaskParameterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createMutation = useCreateTaskParameter();
  const updateMutation = useUpdateTaskParameter();
  
  // Load units for the selector
  const { data: units, isLoading: unitsLoading } = useUnits();
  
  const form = useForm<TaskParameterFormData>({
    resolver: zodResolver(taskParameterSchema),
    defaultValues: {
      name: '',
      label: '',
      type: 'text',
      unit_id: undefined,
      is_required: false,
    },
  });

  // Reset form when modal opens/closes or parameter changes
  useEffect(() => {
    if (parameter && open) {
      form.reset({
        name: parameter.name,
        label: parameter.label,
        type: parameter.type,
        unit_id: parameter.unit_id || undefined,
        is_required: parameter.is_required,
      });
    } else if (!parameter && open) {
      form.reset({
        name: '',
        label: '',
        type: 'text',
        unit_id: undefined,
        is_required: false,
      });
    }
  }, [parameter, open, form]);

  const onSubmit = async (data: TaskParameterFormData) => {
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...data,
        unit_id: data.unit_id?.trim() || undefined,
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
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="parameter-form">
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
                        <SelectContent className="z-[9999]">
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
                  name="unit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una unidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="">Sin unidad</SelectItem>
                          {unitsLoading ? (
                            <SelectItem value="loading" disabled>Cargando unidades...</SelectItem>
                          ) : units && units.length > 0 ? (
                            units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-units" disabled>No hay unidades disponibles</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
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
                form="parameter-form"
                className="w-3/4"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : (parameter ? "Actualizar" : "Guardar")}
              </Button>
            </div>
          </div>
        ),
      }}
    </CustomModalLayout>
  );
}