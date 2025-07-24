import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useCreateTaskParameterOption, useUpdateTaskParameterOption, useTaskParameterOptionGroups, TaskParameterOption } from '@/hooks/use-task-parameters-admin';

// Form schema
const taskParameterOptionSchema = z.object({
  value: z.string().min(1, 'El valor es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  option_group_id: z.string().optional(),
});

type TaskParameterOptionFormData = z.infer<typeof taskParameterOptionSchema>;

interface TaskParameterOptionFormModalProps {
  modalType: 'task-parameter-option';
}

export function TaskParameterOptionFormModal({ modalType }: TaskParameterOptionFormModalProps) {
  const { isOpen, modalData, onClose } = useGlobalModalStore();
  const { parameterId, parameterLabel, option }: { parameterId?: string; parameterLabel?: string; option?: TaskParameterOption } = modalData || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  
  const createMutation = useCreateTaskParameterOption();
  const updateMutation = useUpdateTaskParameterOption();
  
  // Load option groups for this parameter
  const { data: optionGroups = [], isLoading: isLoadingGroups } = useTaskParameterOptionGroups(parameterId || '');
  
  const form = useForm<TaskParameterOptionFormData>({
    resolver: zodResolver(taskParameterOptionSchema),
    defaultValues: {
      value: '',
      label: '',
      option_group_id: '',
    },
  });

  // Load option data when editing
  useEffect(() => {
    if (option) {
      form.reset({
        value: option.name || '',
        label: option.label || '',
        option_group_id: '',
      });
    } else {
      form.reset({
        value: '',
        label: '',
        option_group_id: '',
      });
    }
  }, [option, form]);

  const handleSubmit = async (data: TaskParameterOptionFormData) => {
    if (!parameterId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se ha especificado el parámetro'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (option) {
        // Update existing option
        await updateMutation.mutateAsync({
          id: option.id,
          parameter_id: parameterId,
          name: data.value,
          label: data.label
        });
        
        toast({
          title: 'Opción actualizada',
          description: 'La opción se ha actualizado correctamente'
        });
      } else {
        // Create new option
        await createMutation.mutateAsync({
          parameter_id: parameterId,
          name: data.value,
          label: data.label
        });
        
        toast({
          title: 'Opción creada',
          description: 'La opción se ha creado correctamente'
        });
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al procesar la solicitud'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = null; // No view mode needed for this modal

  const editPanel = (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Label Field */}
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etiqueta (Visible) *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Ladrillo cerámico hueco" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Value Field */}
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (Clave) *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input 
                      placeholder="ej: ladrillo-ceramico-hueco" 
                      {...field} 
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const currentValue = field.value || '';
                      const cursorPosition = (document.activeElement as HTMLInputElement)?.selectionStart || currentValue.length;
                      const newValue = currentValue.slice(0, cursorPosition) + '{value}' + currentValue.slice(cursorPosition);
                      field.onChange(newValue);
                    }}
                  >
                    Insertar {'{value}'}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Usa <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{value}'}</code> si necesitas referenciar el valor dinámicamente. Ejemplo: "ladrillo-<code className="bg-muted px-1 py-0.5 rounded text-xs">{'{value}'}</code>-hueco"
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Option Group Field */}
          <FormField
            control={form.control}
            name="option_group_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grupo de Opciones (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar grupo (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="">Sin grupo</SelectItem>
                    {optionGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  Los grupos ayudan a organizar las opciones por categorías
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );

  return (
    <FormModalLayout
      isOpen={isOpen && modalType === modalType}
      onClose={onClose}
      title={option ? 'Editar Opción' : 'Nueva Opción'}
      description={`${option ? 'Modificar' : 'Agregar'} opción para el parámetro "${parameterLabel}"`}
      isEditing={true}
      viewPanel={viewPanel}
      editPanel={editPanel}
      onSubmit={form.handleSubmit(handleSubmit)}
      submitLabel={option ? 'Guardar Cambios' : 'Crear Opción'}
      isSubmitting={isSubmitting}
      icon={Plus}
    />
  );
}