import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useCreateTaskParameterOption, useUpdateTaskParameterOption, TaskParameterOption } from '@/hooks/use-task-parameters-admin';

// Form schema
const taskParameterOptionSchema = z.object({
  value: z.string().min(1, 'El valor es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
});

type TaskParameterOptionFormData = z.infer<typeof taskParameterOptionSchema>;

interface TaskParameterOptionFormModalProps {
  modalType: 'task-parameter-option';
}

export function TaskParameterOptionFormModal({ modalType }: TaskParameterOptionFormModalProps) {
  const { open, data, closeModal } = useGlobalModalStore();
  const { parameterId, parameterLabel, option }: { parameterId?: string; parameterLabel?: string; option?: TaskParameterOption } = data || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  
  const createMutation = useCreateTaskParameterOption();
  const updateMutation = useUpdateTaskParameterOption();
  
  // Function to normalize label to value
  const normalizeLabel = (label: string): string => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
  };

  const form = useForm<TaskParameterOptionFormData>({
    resolver: zodResolver(taskParameterOptionSchema),
    defaultValues: {
      value: '',
      label: '',
    },
  });

  // Load option data when editing
  useEffect(() => {
    if (option) {
      form.reset({
        value: option.name || '',
        label: option.label || '',
      });
    } else {
      form.reset({
        value: '',
        label: '',
      });
    }
  }, [option, form]);

  // Watch label changes to auto-generate value
  const watchedLabel = form.watch('label');
  useEffect(() => {
    // Only auto-generate if not editing (creating new option)
    if (!option && watchedLabel) {
      const normalizedValue = normalizeLabel(watchedLabel);
      form.setValue('value', normalizedValue);
    }
  }, [watchedLabel, option, form]);

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
      
      closeModal();
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

  const viewPanel = (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Nombre (visible)</h4>
        <p className="text-muted-foreground mt-1">{option?.label || 'Sin nombre'}</p>
      </div>
      
      <div>
        <h4 className="font-medium">Slug</h4>
        <p className="text-muted-foreground mt-1 font-mono text-sm">{option?.name || 'Sin slug'}</p>
      </div>
    </div>
  );

  const editPanel = (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Label Field */}
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre (visible) *</FormLabel>
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
                <FormLabel>Slug *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="ej: ladrillo-ceramico-hueco" 
                    {...field} 
                  />
                </FormControl>
                <div className="text-sm text-muted-foreground">
                  Se genera automáticamente basado en el nombre. Puedes modificarlo si es necesario.
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title={option ? 'Editar Opción' : 'Nueva Opción'}
      icon={Plus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={closeModal}
      rightLabel={option ? 'Guardar Cambios' : 'Crear Opción'}
      onRightClick={() => {
        form.handleSubmit(handleSubmit)();
      }}
      isLoading={isSubmitting}
    />
  );

  if (!open || modalType !== 'task-parameter-option') return null;

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={closeModal}
      onSubmit={() => form.handleSubmit(handleSubmit)()}
      isEditing={true}
    />
  );
}