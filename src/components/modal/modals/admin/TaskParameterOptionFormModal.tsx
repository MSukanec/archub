import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useCreateTaskParameterOption, useUpdateTaskParameterOption, TaskParameterOption } from '@/hooks/use-task-parameters-admin';
import { useTopLevelCategories, useUnits } from '@/hooks/use-task-categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Form schema
const taskParameterOptionSchema = z.object({
  value: z.string().min(1, 'El valor es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  unit_id: z.string().optional(),
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
  
  // Fetch categories and units for conditional fields
  const { data: categories = [] } = useTopLevelCategories();
  const { data: units = [] } = useUnits();
  
  // Check if this is the "Tipo de Tarea" parameter
  const isTipoTareaParameter = parameterId === '42d5048d-e839-496d-ad6c-9d185002eee8';
  
  // Function to normalize label to value (snake_case)
  const normalizeLabel = (label: string): string => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s_]/g, '') // Remove special characters, keep underscores
      .trim()
      .replace(/\s+/g, '_'); // Replace spaces with underscores
  };

  const form = useForm<TaskParameterOptionFormData>({
    resolver: zodResolver(taskParameterOptionSchema),
    defaultValues: {
      value: '',
      label: '',
      description: '',
      category_id: '',
      unit_id: '',
    },
  });

  // Load option data when editing
  useEffect(() => {
    if (option) {
      form.reset({
        value: option.name || '',
        label: option.label || '',
        description: option.description || '',
        category_id: (option as any).category_id || '',
        unit_id: (option as any).unit_id || '',
      });
    } else {
      form.reset({
        value: '',
        label: '',
        description: '',
        category_id: '',
        unit_id: '',
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
        const updateData: any = {
          id: option.id,
          parameter_id: parameterId,
          name: data.value,
          label: data.label,
          description: data.description
        };
        
        // Add conditional fields only for "Tipo de Tarea" parameter
        if (isTipoTareaParameter) {
          if (data.category_id) updateData.category_id = data.category_id;
          if (data.unit_id) updateData.unit_id = data.unit_id;
        }
        
        await updateMutation.mutateAsync(updateData);
        
        toast({
          title: 'Opción actualizada',
          description: 'La opción se ha actualizado correctamente'
        });
      } else {
        // Create new option
        const createData: any = {
          parameter_id: parameterId,
          name: data.value,
          label: data.label,
          description: data.description
        };
        
        // Add conditional fields only for "Tipo de Tarea" parameter
        if (isTipoTareaParameter) {
          if (data.category_id) createData.category_id = data.category_id;
          if (data.unit_id) createData.unit_id = data.unit_id;
        }
        
        await createMutation.mutateAsync(createData);
        
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
        <h4 className="font-medium">Descripción</h4>
        <p className="text-muted-foreground mt-1">{option?.description || 'Sin descripción'}</p>
      </div>
      
      <div>
        <h4 className="font-medium">Slug</h4>
        <p className="text-muted-foreground mt-1 font-mono text-sm">{option?.name || 'Sin slug'}</p>
      </div>

      {/* Show category and unit info for "Tipo de Tarea" parameter */}
      {isTipoTareaParameter && (
        <>
          <div>
            <h4 className="font-medium">Categoría (Rubro)</h4>
            <p className="text-muted-foreground mt-1">
              {(option as any)?.category_id 
                ? categories.find(c => c.id === (option as any)?.category_id)?.name || 'Categoría no encontrada'
                : 'Sin categoría'
              }
            </p>
          </div>
          
          <div>
            <h4 className="font-medium">Unidad</h4>
            <p className="text-muted-foreground mt-1">
              {(option as any)?.unit_id 
                ? units.find(u => u.id === (option as any)?.unit_id)?.name || 'Unidad no encontrada'
                : 'Sin unidad'
              }
            </p>
          </div>
        </>
      )}
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

          {/* Description Field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descripción detallada de la opción (opcional)" 
                    {...field} 
                    rows={3}
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

          {/* Conditional fields - only for "Tipo de Tarea" parameter */}
          {isTipoTareaParameter && (
            <>
              {/* Category Field */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría (Rubro)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin categoría</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name} ({category.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit Field */}
              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar unidad..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin unidad</SelectItem>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} {unit.abbreviation && `(${unit.abbreviation})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
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
      showLoadingSpinner={isSubmitting}
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