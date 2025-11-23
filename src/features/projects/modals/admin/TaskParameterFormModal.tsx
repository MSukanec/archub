import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { useToast } from '@/hooks/use-toast';

import { useCreateTaskParameter, useUpdateTaskParameter, TaskParameter } from '@/hooks/use-task-parameters-admin';
import { useUnits } from '@/hooks/use-units';

const taskParameterSchema = z.object({
  slug: z.string().min(1, 'El slug es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  type: z.enum(['text', 'number', 'select', 'boolean'], { 
    required_error: 'El tipo es requerido' 
  }),
  expression_template: z.string().optional(),
  is_required: z.boolean().default(false),
});

type TaskParameterFormData = z.infer<typeof taskParameterSchema>;

interface TaskParameterFormModalProps {
  modalData?: {
    parameter?: TaskParameter;
    onParameterCreated?: (parameterId: string) => void;
  };
  onClose: () => void;
}

export function TaskParameterFormModal({ modalData, onClose }: TaskParameterFormModalProps) {
  const { parameter, onParameterCreated } = modalData || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const createMutation = useCreateTaskParameter();
  const updateMutation = useUpdateTaskParameter();
  
  // Load units for the selector
  const { data: units, isLoading: unitsLoading } = useUnits();
  
  const form = useForm<TaskParameterFormData>({
    resolver: zodResolver(taskParameterSchema),
    defaultValues: {
      slug: '',
      label: '',
      type: 'text',
      expression_template: '{value}',
      is_required: false,
    },
  });

  // Load parameter data when editing
  useEffect(() => {
    if (parameter) {
      form.reset({
        slug: parameter.slug || '',
        label: parameter.label || '',
        type: parameter.type as any || 'text',
        expression_template: parameter.expression_template || '{value}',
        is_required: parameter.is_required || false,
      });
    }
  }, [parameter, form]);

  // Group functionality removed - using simplified system

  // Submit function
  const handleSubmit = async (data: TaskParameterFormData) => {
    console.log('Creating parameter with data:', data);
    setIsSubmitting(true);
    
    try {
      let result;
      if (parameter) {
        // Update existing parameter
        result = await updateMutation.mutateAsync({
          id: parameter.id,
          ...data
        });
      } else {
        // Create new parameter
        result = await createMutation.mutateAsync(data);
      }
      
      console.log('Parameter created with ID:', result.id);
      
      toast({
        title: parameter ? 'Parámetro actualizado' : 'Parámetro creado',
        description: parameter ? 'El parámetro se ha actualizado correctamente' : 'El parámetro se ha creado correctamente'
      });

      if (onParameterCreated && result.id) {
        onParameterCreated(result.id);
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
          {/* Nombre y Slug inline */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre (visible) *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Ladrillos y Bloques" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Auto-generate slug from label if creating new parameter (snake_case)
                        if (!parameter) {
                          const slug = e.target.value
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '') // Remove accents
                            .replace(/ñ/g, 'n') // Replace ñ with n
                            .replace(/[^a-z0-9\s_]/g, '') // Remove special characters, keep underscores
                            .replace(/\s+/g, '_') // Replace spaces with underscores
                            .replace(/_+/g, '_') // Replace multiple underscores with single
                            .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
                          form.setValue('slug', slug);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ej: ladrillos_y_bloques" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            El Slug se genera automáticamente en formato snake_case basado en el nombre. Puedes modificarlo si es necesario.
          </div>

          {/* Tipo y Plantilla inline */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
              name="expression_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plantilla de frase</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        placeholder="de {value}" 
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            Usa <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{value}'}</code> donde quieres que aparezca el valor seleccionado. Ejemplo: "de <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{value}'}</code>"
          </div>

          {/* Campo is_required */}
          <FormField
            control={form.control}
            name="is_required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Parámetro obligatorio
                  </FormLabel>
                  <FormDescription>
                    Si está marcado, el usuario deberá seleccionar una opción para este parámetro antes de poder crear la tarea.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </form>
      </Form>

      {/* Groups functionality removed - simplified system */}

      {/* Assignment Modal is now handled by ModalFactory */}
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title={parameter ? "Editar Parámetro" : "Nuevo Parámetro"}
      description="Crea un nuevo parámetro de plantilla"
      icon={Settings}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={parameter ? "Actualizar" : "Guardar"}
      onRightClick={form.handleSubmit(handleSubmit)}
      isLoading={isSubmitting}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      isEditing={true}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}