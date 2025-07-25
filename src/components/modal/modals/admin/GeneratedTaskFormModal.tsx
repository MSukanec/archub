import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { useToast } from '@/hooks/use-toast';

import { 
  useTaskTemplates, 
  useTaskTemplateParameters, 
  useTaskTemplateParameterOptions 
} from '@/hooks/use-task-templates';
import { 
  useCreateGeneratedTask, 
  useUpdateGeneratedTask,
  GeneratedTask 
} from '@/hooks/use-generated-tasks';
import { useMaterials } from '@/hooks/use-materials';
import { useTaskMaterials, useCreateTaskMaterial, useDeleteTaskMaterial, useUpdateTaskMaterial } from '@/hooks/use-generated-tasks';
import { useCurrentUser } from '@/hooks/use-current-user';
import { generateTaskDescription } from '@/utils/taskDescriptionGenerator';

// Component to handle individual parameter rendering with proper hook usage
function ParameterField({ parameter, value, onChange }: { 
  parameter: any, 
  value: string, 
  onChange: (value: string) => void 
}) {
  const { data: options = [], isLoading, error } = useTaskTemplateParameterOptions(parameter.id);
  
  // Debug logging
  console.log('🔍 ParameterField Debug:', {
    parameterId: parameter.id,
    parameterLabel: parameter.label,
    optionsCount: options?.length || 0,
    isLoading,
    error: error?.message,
    options: options
  });
  
  return (
    <div className="space-y-2">
      <FormLabel>{parameter.label}</FormLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Seleccionar ${parameter.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {isLoading ? (
            <SelectItem value="" disabled>Cargando opciones...</SelectItem>
          ) : options.length > 0 ? (
            options.map((option: any) => (
              <SelectItem key={option.id} value={option.value || option.id}>
                {option.label || option.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="" disabled>No hay opciones disponibles</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

const generatedTaskSchema = z.object({
  template_id: z.string().min(1, 'La plantilla es requerida'),
  is_public: z.boolean(),
  param_values: z.record(z.any()).optional()
});

type GeneratedTaskFormData = z.infer<typeof generatedTaskSchema>;

interface GeneratedTaskFormModalProps {
  modalData?: {
    generatedTask?: GeneratedTask;
  };
  onClose: () => void;
}

export function GeneratedTaskFormModal({ modalData, onClose }: GeneratedTaskFormModalProps) {
  const { generatedTask } = modalData || {};
  const isEditing = !!generatedTask;
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState<{ material_id: string; amount: number }>({
    material_id: "",
    amount: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { data: templates, isLoading: templatesLoading } = useTaskTemplates();
  const { data: parameters, isLoading: parametersLoading } = useTaskTemplateParameters(selectedTemplateId || null);
  const { data: materials } = useMaterials();
  const { data: taskMaterials } = useTaskMaterials(createdTaskId || generatedTask?.id || null);
  
  const createGeneratedTask = useCreateGeneratedTask();
  const updateGeneratedTask = useUpdateGeneratedTask();
  const createTaskMaterial = useCreateTaskMaterial();
  const deleteTaskMaterial = useDeleteTaskMaterial();
  const updateTaskMaterial = useUpdateTaskMaterial();

  const form = useForm<GeneratedTaskFormData>({
    resolver: zodResolver(generatedTaskSchema),
    defaultValues: {
      template_id: '',
      is_public: false,
      param_values: {}
    }
  });

  // Load parameter options - using individual hooks to avoid conditional hook calls
  const { data: templateParams } = useTaskTemplateParameters(selectedTemplateId || null);
  
  // We need to load options for each parameter, but we can't use hooks in a map
  // Instead, we'll create a custom hook that handles this properly
  const getParameterOptions = (paramId: string) => {
    // This will be handled in the render loop below
    return [];
  };

  // Initialize form when editing
  useEffect(() => {
    if (generatedTask) {
      console.log('Edit mode - loading existing task:', generatedTask);
      setSelectedTemplateId(generatedTask.template_id);
      setParamValues(generatedTask.param_values || {});
      setCreatedTaskId(generatedTask.id);
      
      form.reset({
        template_id: generatedTask.template_id,
        is_public: generatedTask.is_public,
        param_values: generatedTask.param_values || {}
      });
    } else {
      console.log('Create mode - resetting form');
      setSelectedTemplateId('');
      setParamValues({});
      setCreatedTaskId(null);
      
      form.reset({
        template_id: '',
        is_public: false,
        param_values: {}
      });
    }
  }, [generatedTask, form]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setParamValues({});
    form.setValue('template_id', templateId);
    form.setValue('param_values', {});
  };

  // Handle parameter value changes
  const handleParameterChange = (paramId: string, value: any) => {
    const newParamValues = { ...paramValues, [paramId]: value };
    setParamValues(newParamValues);
    form.setValue('param_values', newParamValues);
  };

  // Generate task description
  const generateDescription = () => {
    if (!selectedTemplateId || !templates) return '';
    
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return '';

    // generateTaskDescription might return a Promise, so we handle it properly
    try {
      const result = generateTaskDescription(template.name_template, paramValues, []);
      return typeof result === 'string' ? result : 'Generando descripción...';
    } catch (error) {
      console.error('Error generating description:', error);
      return 'Error al generar descripción';
    }
  };

  // Handle form submission
  const handleSubmit = async (data: GeneratedTaskFormData) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing && generatedTask) {
        const updatedTask = await updateGeneratedTask.mutateAsync({
          task_id: generatedTask.id,
          input_param_values: data.param_values || {},
          input_is_system: false
        });
        
        toast({
          title: "Tarea actualizada",
          description: "La tarea generada se actualizó correctamente"
        });
        
        onClose();
      } else {
        const newTask = await createGeneratedTask.mutateAsync({
          template_id: data.template_id,
          param_values: data.param_values || {},
          organization_id: userData?.organization?.id || '',
          is_system: false
        });
        
        setCreatedTaskId(newTask.new_task?.id || null);
        
        toast({
          title: "Tarea creada",
          description: "La tarea generada se creó correctamente"
        });
        
        onClose();
      }
    } catch (error) {
      console.error('Error saving generated task:', error);
      toast({
        title: "Error",
        description: isEditing ? "No se pudo actualizar la tarea" : "No se pudo crear la tarea",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle material operations
  const handleAddMaterial = async () => {
    if (!newMaterial.material_id || !createdTaskId) return;
    
    try {
      await createTaskMaterial.mutateAsync({
        task_id: createdTaskId,
        material_id: newMaterial.material_id,
        amount: newMaterial.amount,
        organization_id: userData?.organization?.id || ''
      });
      
      setNewMaterial({ material_id: "", amount: 1 });
      
      toast({
        title: "Material agregado",
        description: "El material se agregó correctamente a la tarea"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el material",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    try {
      await deleteTaskMaterial.mutateAsync(materialId);
      
      toast({
        title: "Material eliminado",
        description: "El material se eliminó de la tarea"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el material",
        variant: "destructive"
      });
    }
  };

  const viewPanel = null; // No view mode needed

  const editPanel = (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Template Selection */}
          <FormField
            control={form.control}
            name="template_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plantilla de Tarea *</FormLabel>
                <Select onValueChange={handleTemplateChange} value={selectedTemplateId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plantilla" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[9999]">
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name_template}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Parameters Section */}
          {selectedTemplateId && (
            <>
              <Separator />
              
              {/* Section: Parámetros de la Plantilla */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                    <Target className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Parámetros de la Plantilla</h3>
                    <p className="text-xs text-muted-foreground">Configura los valores específicos para esta tarea</p>
                  </div>
                </div>

                {/* Task Preview */}
                <div>
                  <FormLabel className="text-sm font-medium">Vista Previa</FormLabel>
                  <div className="mt-2 p-3 bg-muted rounded-lg border-l-4 border-accent">
                    <p className="text-sm font-medium">
                      {generateDescription() || 'Selecciona los parámetros para ver la vista previa'}
                    </p>
                  </div>
                </div>

                {/* Parameters */}
                {parameters && parameters.length > 0 && (
                  <div className="space-y-4">
                      {parameters.map((param) => (
                        <ParameterField
                          key={param.id}
                          parameter={param}
                          value={paramValues[param.id] || ''}
                          onChange={(value) => handleParameterChange(param.id, value)}
                        />
                      ))}
                    </div>
                  )}
              </div>
            </>
          )}

          {/* Materials Section - Only show for existing tasks */}
          {(createdTaskId || generatedTask) && (
            <>
              <Separator />
              
              {/* Section: Materiales de la Tarea */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                    <Plus className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Materiales de la Tarea</h3>
                    <p className="text-xs text-muted-foreground">Gestiona los materiales necesarios para esta tarea</p>
                  </div>
                </div>

                <div className="space-y-4">

              {/* Add Material */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Select
                      value={newMaterial.material_id}
                      onValueChange={(value) => setNewMaterial({ ...newMaterial, material_id: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar material" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        {materials?.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={newMaterial.amount}
                      onChange={(e) => setNewMaterial({ ...newMaterial, amount: Number(e.target.value) })}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      onClick={handleAddMaterial}
                      disabled={!newMaterial.material_id}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Materials List */}
              {taskMaterials && taskMaterials.length > 0 && (
                <div className="space-y-2">
                  {taskMaterials.map((taskMaterial) => (
                    <Card key={taskMaterial.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{taskMaterial.materials?.name || 'Material desconocido'}</span>
                            <Badge variant="secondary">
                              {taskMaterial.amount} {taskMaterial.materials?.units?.name || ''}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMaterial(taskMaterial.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
                </div>
              </div>
            </>
          )}
        </form>
      </Form>
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Tarea Generada" : "Nueva Tarea Generada"}
      icon={Target}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Actualizar" : "Crear"}
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