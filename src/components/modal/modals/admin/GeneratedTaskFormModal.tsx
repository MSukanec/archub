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
import { supabase } from '@/lib/supabase';

// Simple ParameterField component - following original approach
function ParameterField({ parameter, value, onChange, parameterOptions }: { 
  parameter: any, 
  value: string, 
  onChange: (value: string) => void,
  parameterOptions: any[]
}) {
  const options = parameterOptions || [];

  return (
    <div className="space-y-2">
      <FormLabel>{parameter.label}</FormLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Seleccionar ${parameter.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {options.length > 0 ? (
            options.map((option: any) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
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
  const [parameterOptions, setParameterOptions] = useState<Record<string, any[]>>({});
  
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

  // Load parameter options for all parameters
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      const loadOptions = async () => {
        const optionsMap: Record<string, any[]> = {};
        
        for (const param of parameters) {
          try {
            const { data, error } = await supabase
              .from('task_parameter_values')
              .select('*')
              .eq('parameter_id', param.id);
            
            if (!error && data) {
              optionsMap[param.id] = data.map(option => ({
                id: option.id,
                value: option.id, // THIS IS THE KEY - value should be the ID for the Select component
                label: option.label
              }));
            }
          } catch (error) {
            console.error('Error loading options for parameter:', param.id, error);
          }
        }
        
        setParameterOptions(optionsMap);
      };
      
      loadOptions();
    }
  }, [parameters]);

  // Initialize form when editing - SIMPLE approach like the original
  useEffect(() => {
    if (generatedTask) {
      // FIRST: Set template and create task ID
      setSelectedTemplateId(generatedTask.template_id);
      setCreatedTaskId(generatedTask.id);
      
      // SECOND: Set param values directly - store as IDs for Select components
      if (generatedTask.param_values && parameterOptions && Object.keys(parameterOptions).length > 0) {
        const convertedValues: Record<string, string> = {};
        
        Object.entries(generatedTask.param_values).forEach(([paramName, storedValue]) => {
          const param = parameters?.find(p => p.name === paramName);
          if (param && parameterOptions[param.id]) {
            // Find matching option - this converts compressed values to IDs
            const options = parameterOptions[param.id];
            const matchingOption = options.find(opt => 
              opt.id === storedValue || 
              opt.label === storedValue ||
              opt.label.toLowerCase().includes(storedValue.toString().toLowerCase())
            );
            
            convertedValues[paramName] = matchingOption ? matchingOption.id : storedValue.toString();
          } else {
            convertedValues[paramName] = storedValue.toString();
          }
        });
        
        setParamValues(convertedValues);
        form.setValue('param_values', convertedValues);
      } else {
        setParamValues(generatedTask.param_values || {});
        form.setValue('param_values', generatedTask.param_values || {});
      }
      
      // THIRD: Set form values
      form.setValue('template_id', generatedTask.template_id);
      form.setValue('is_public', generatedTask.is_public);
      
    } else {
      // Reset for create mode
      setSelectedTemplateId('');
      setParamValues({});
      setCreatedTaskId(null);
      form.reset({
        template_id: '',
        is_public: false,
        param_values: {}
      });
    }
  }, [generatedTask, parameterOptions, parameters, form]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    // Only clear param values if this is a new selection (not during initialization)
    if (!isEditing || templateId !== generatedTask?.template_id) {
      setParamValues({});
      form.setValue('param_values', {});
    }
    form.setValue('template_id', templateId);
  };

  // Handle parameter value changes
  const handleParameterChange = (paramKey: string, value: any) => {
    const newParamValues = { ...paramValues, [paramKey]: value };
    setParamValues(newParamValues);
    form.setValue('param_values', newParamValues);
  };

  // Generate task description using the EXACT original approach
  const generateDescriptionWithExpressions = (paramValues: Record<string, any>) => {
    if (!parameters) return "Seleccione los parámetros para ver la vista previa";

    const currentTemplate = templates?.find(t => t.id === selectedTemplateId);
    if (!currentTemplate) return "Seleccione una plantilla";

    let fragments: string[] = [];

    parameters
      .sort((a, b) => a.position - b.position)
      .forEach(param => {
        const rawValue = paramValues[param.name];
        if (!rawValue) return;

        // Buscar label para select
        let label = rawValue.toString();
        const option = parameterOptions[param.id]?.find(opt => opt.value === rawValue);
        if (option?.label) label = option.label;

        // Aplicar plantilla del parámetro
        const expr = param.expression_template || '{value}';
        const fragment = expr.replace('{value}', label);

        fragments.push(fragment);
      });

    return `${currentTemplate.name} ${fragments.join(' ')}.`.trim();
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
                <Select onValueChange={handleTemplateChange} value={field.value || selectedTemplateId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plantilla" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[9999]">
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
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
                  <FormLabel className="text-sm font-medium">Vista Previa de la Plantilla</FormLabel>
                  <p className="text-xs text-muted-foreground mb-2">Así se verá el nombre de la tarea generada</p>
                  <div className="mt-2 p-3 bg-muted rounded-lg border-2 border-dashed border-accent">
                    <p className="text-sm font-medium">
                      {generateDescriptionWithExpressions(paramValues) || 'Generando descripción...'}
                    </p>
                  </div>
                </div>

                {/* Parameters */}
                {parameters && parameters.length > 0 && (
                  <div className="space-y-4">
                      {parameters.map((param) => {
                        const currentValue = paramValues[param.name] || '';
                        const options = parameterOptions[param.id] || [];
                        
                        return (
                          <ParameterField
                            key={param.id}
                            parameter={param}
                            value={currentValue}
                            onChange={(value) => handleParameterChange(param.name, value)}
                            parameterOptions={options}
                          />
                        );
                      })}
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
      rightIsLoading={isSubmitting}
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