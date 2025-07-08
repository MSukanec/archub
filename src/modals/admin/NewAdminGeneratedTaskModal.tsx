import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CustomModalLayout } from "@/components/ui-custom/modal/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/modal/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/modal/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/modal/CustomModalFooter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Settings, Package, Loader2, Plus, Trash2 } from "lucide-react";
import { useTaskTemplates, useTaskTemplateParameters } from "@/hooks/use-task-templates";
import { useCreateGeneratedTask, useUpdateGeneratedTask, useTaskMaterials, useCreateTaskMaterial, useDeleteTaskMaterial } from "@/hooks/use-generated-tasks";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMaterials } from "@/hooks/use-materials";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

interface GeneratedTask {
  id: string
  code: string
  template_id: string
  param_values: any
  description: string
  created_by: string
  is_public: boolean
  created_at: string
}

interface NewAdminGeneratedTaskModalProps {
  open: boolean
  onClose: () => void
  generatedTask?: GeneratedTask | null
}

const formSchema = z.object({
  template_id: z.string().min(1, "Debe seleccionar una plantilla")
}).catchall(z.any());

export function NewAdminGeneratedTaskModal({ 
  open, 
  onClose, 
  generatedTask 
}: NewAdminGeneratedTaskModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [existingTask, setExistingTask] = useState<any>(null);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState<{ material_id: string; amount: number }>({
    material_id: "",
    amount: 1
  });
  
  const isEditing = !!generatedTask;
  
  const { data: userData } = useCurrentUser();
  const { data: templates, isLoading: templatesLoading } = useTaskTemplates();
  const { data: parameters, isLoading: parametersLoading, refetch: refetchParameters } = useTaskTemplateParameters(selectedTemplateId || null);
  const { data: materials } = useMaterials();
  const { data: taskMaterials } = useTaskMaterials(createdTaskId || generatedTask?.id || null);
  const createGeneratedTask = useCreateGeneratedTask();
  const updateGeneratedTask = useUpdateGeneratedTask();
  const createTaskMaterial = useCreateTaskMaterial();
  const deleteTaskMaterial = useDeleteTaskMaterial();
  
  // Load parameter options for each parameter
  const [parameterOptions, setParameterOptions] = useState<Record<string, any[]>>({});
  
  // Load options for select type parameters
  useEffect(() => {
    if (parameters?.length) {
      const loadOptions = async () => {
        const optionsMap: Record<string, any[]> = {};
        
        for (const param of parameters) {
          if (param.type === 'select') {
            try {
              if (supabase) {
                const { data: options, error } = await supabase
                  .from('task_parameter_values')
                  .select('name, label')
                  .eq('parameter_id', param.id)
                  .order('name');
                
                if (error) {
                  console.error('Error fetching parameter options:', error);
                  optionsMap[param.id] = [];
                } else {
                  // Transform data to expected format
                  optionsMap[param.id] = (options || []).map(opt => ({
                    value: opt.name,
                    label: opt.label || opt.name
                  }));
                }
              }
            } catch (error) {
              console.error(`Error loading options for parameter ${param.id}:`, error);
              optionsMap[param.id] = [];
            }
          }
        }
        
        setParameterOptions(optionsMap);
      };
      
      loadOptions();
    }
  }, [parameters]);

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template_id: "",
      ...paramValues
    },
    mode: "onChange"
  });

  // Watch all form values for real-time preview
  const watchedValues = useWatch({ control: form.control });

  // Reset form when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      console.log('Template changed, resetting form parameters for template:', selectedTemplateId);
      
      // Invalidate and refetch parameters to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', selectedTemplateId] });
      refetchParameters();
      
      const newParamValues: Record<string, any> = {};
      parameters?.forEach(param => {
        if (param.type === 'boolean') {
          newParamValues[param.name] = false;
        } else {
          newParamValues[param.name] = '';
        }
      });
      setParamValues(newParamValues);
      form.reset({
        template_id: selectedTemplateId,
        ...newParamValues
      });
    }
  }, [selectedTemplateId, parameters, refetchParameters]);

  // Initialize form for editing
  useEffect(() => {
    if (isEditing && generatedTask && open) {
      console.log('Editing mode - initializing with task data:', generatedTask);
      setSelectedTemplateId(generatedTask.template_id);
      setParamValues(generatedTask.param_values || {});
      setCreatedTaskId(generatedTask.id);
      form.reset({
        template_id: generatedTask.template_id,
        ...generatedTask.param_values
      });
    } else if (!isEditing && open) {
      console.log('Create mode - resetting form');
      setSelectedTemplateId("");
      setParamValues({});
      setExistingTask(null);
      setCreatedTaskId(null);
      setNewMaterial({ material_id: "", amount: 1 });
      form.reset({
        template_id: ""
      });
    }
  }, [isEditing, generatedTask, open]);

  // Force refresh when modal opens to get latest data
  useEffect(() => {
    if (open) {
      console.log('Modal opened, invalidating queries for fresh data');
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters'] });
      if (selectedTemplateId) {
        queryClient.invalidateQueries({ queryKey: ['task-template-parameters', selectedTemplateId] });
      }
    }
  }, [open, selectedTemplateId]);

  // Generate description from template and parameters
  const generateDescription = (templateNameTemplate: string, paramValues: Record<string, any>) => {
    let description = templateNameTemplate;
    
    // Replace parameter placeholders with actual values
    parameters?.forEach(param => {
      const value = paramValues[param.name];
      if (value !== undefined && value !== '') {
        const placeholder = `{{${param.name}}}`;
        let displayValue = value.toString();
        
        // For select parameters, find the label instead of using raw value
        if (param.type === 'select') {
          const option = parameterOptions[param.id]?.find(opt => opt.value === value);
          if (option) {
            displayValue = option.label;
          }
        }
        
        description = description.replace(new RegExp(placeholder, 'g'), displayValue);
      }
    });
    
    return description;
  };

  // Generate description using expression templates from parameters
  const generateDescriptionWithExpressions = (paramValues: Record<string, any>) => {
    if (!parameters) return "Seleccione los parámetros para ver la vista previa";
    
    // Find the selected template
    const currentTemplate = templates?.find(t => t.id === selectedTemplateId);
    if (!currentTemplate) return "Seleccione una plantilla para ver la vista previa";
    
    // Get category name (subcategory)
    const categoryName = categories?.find(cat => cat.id === currentTemplate.category_id)?.name || '';
    
    // Sort parameters by position
    const sortedParameters = [...parameters].sort((a, b) => a.position - b.position);
    
    // Generate expression parts for each parameter
    const expressionParts: string[] = [];
    
    sortedParameters.forEach(param => {
      const value = paramValues[param.name];
      const expressionTemplate = param.expression_template;
      
      if (value && expressionTemplate) {
        let displayValue = value.toString();
        
        // For select parameters, find the label instead of using raw value
        if (param.type === 'select') {
          const option = parameterOptions[param.id]?.find(opt => opt.value === value || opt.id === value);
          if (option) {
            displayValue = option.label;
          }
        }
        
        // Replace {value} in expression template with actual value
        const expressionPart = expressionTemplate.replace(/{value}/g, displayValue);
        expressionParts.push(expressionPart);
      }
    });
    
    // Combine: Category Name + Expression Parts + "."
    const fullDescription = `${categoryName} ${expressionParts.join(' ')}.`;
    return fullDescription;
  };

  const handleSubmit = async (data: any) => {
    if (!userData?.organization?.id) return;
    
    const { template_id, ...params } = data;
    
    // Find the selected template to get its category information
    const selectedTemplate = templates?.find(t => t.id === template_id);
    const generatedDescription = generateDescriptionWithExpressions(params);
    
    try {
      if (isEditing && generatedTask?.id) {
        // Actualizar tarea existente
        await updateGeneratedTask.mutateAsync({
          task_id: generatedTask.id,
          input_param_values: params,
          input_description: generatedDescription
        });
        onClose();
      } else {
        // Crear nueva tarea
        const result = await createGeneratedTask.mutateAsync({
          input_template_id: template_id,
          input_param_values: params,
          input_organization_id: userData.organization.id,
          input_description: generatedDescription
        });
        
        if (result.existing_task) {
          setExistingTask(result.existing_task);
        } else if (result.task_id) {
          // Capturar el ID de la tarea creada para habilitar la gestión de materiales
          setCreatedTaskId(result.task_id);
        } else {
          onClose();
        }
      }
    } catch (error) {
      console.error("Error handling task:", error);
    }
  };

  // Función para agregar material
  const handleAddMaterial = async () => {
    console.log('handleAddMaterial called with:', {
      material_id: newMaterial.material_id,
      amount: newMaterial.amount,
      organization_id: userData?.organization?.id,
      createdTaskId,
      generatedTaskId: generatedTask?.id
    });
    
    if (!newMaterial.material_id || newMaterial.amount <= 0 || !userData?.organization?.id) {
      console.log('Validation failed:', {
        hasMaterialId: !!newMaterial.material_id,
        validAmount: newMaterial.amount > 0,
        hasOrganization: !!userData?.organization?.id
      });
      return;
    }
    
    const taskId = createdTaskId || generatedTask?.id;
    if (!taskId) {
      console.log('No task ID available');
      return;
    }
    
    const materialData = {
      task_id: taskId,
      material_id: newMaterial.material_id,
      amount: newMaterial.amount,
      organization_id: userData.organization.id
    };
    
    console.log('About to create material with data:', materialData);
    
    try {
      await createTaskMaterial.mutateAsync(materialData);
      
      setNewMaterial({ material_id: "", amount: 1 });
    } catch (error) {
      console.error("Error adding material:", error);
    }
  };

  // Función para eliminar material
  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await deleteTaskMaterial.mutateAsync(materialId);
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };

  const ParameterField = ({ param }: { param: any }) => {
    // Use the cached options from parameterOptions state
    const options = parameterOptions[param.id] || [];

    switch (param.type) {
      case 'text':
        return (
          <FormField
            key={param.name}
            control={form.control}
            name={param.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className={param.is_required ? "required-asterisk" : ""}>
                  {param.label}
                  {param.unit && <span className="text-xs text-muted-foreground ml-1">({param.unit})</span>}
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'number':
        return (
          <FormField
            key={param.name}
            control={form.control}
            name={param.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className={param.is_required ? "required-asterisk" : ""}>
                  {param.label}
                  {param.unit && <span className="text-xs text-muted-foreground ml-1">({param.unit})</span>}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'select':
        return (
          <FormField
            key={param.name}
            control={form.control}
            name={param.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className={param.is_required ? "required-asterisk" : ""}>
                  {param.label}
                  {param.unit && <span className="text-xs text-muted-foreground ml-1">({param.unit})</span>}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options?.map((option: any, index: number) => (
                      <SelectItem key={option.id || `option-${index}`} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'boolean':
        return (
          <FormField
            key={param.name}
            control={form.control}
            name={param.name}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className={param.is_required ? "required-asterisk" : ""}>
                    {param.label}
                  </FormLabel>
                  {param.unit && (
                    <div className="text-xs text-muted-foreground">
                      {param.unit}
                    </div>
                  )}
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );
      
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={isEditing ? "Editar Tarea Generada" : "Nueva Tarea Generada"}
            description={isEditing ? "Modificar tarea generada existente" : "Crear nueva tarea generada basada en plantilla"}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            {existingTask ? (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 bg-yellow-50 dark:bg-yellow-900/20">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Tarea Existente Encontrada
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Código:</span> {existingTask.code}</p>
                    <p><span className="font-medium">Descripción:</span> {existingTask.description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <Accordion type="single" collapsible defaultValue="task-info" className="w-full">
                    {/* Primer acordeón: Información de la Tarea */}
                    <AccordionItem value="task-info">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Información de la Tarea
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="template_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="required-asterisk">Plantilla de Tarea</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setSelectedTemplateId(value);
                                }} 
                                value={field.value}
                                disabled={templatesLoading}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar plantilla..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
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

                        {selectedTemplateId && parametersLoading && (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-muted-foreground">Cargando parámetros...</span>
                          </div>
                        )}

                        {selectedTemplateId && !parametersLoading && parameters && parameters.length > 0 && (
                          <div className="space-y-4">
                            <div className="border-t pt-4">
                              <h3 className="text-sm font-medium mb-3">Parámetros de la Plantilla</h3>
                              <div className="space-y-4">
                                {parameters.map((param) => (
                                  <ParameterField key={`${param.id}-${param.name}`} param={param} />
                                ))}
                              </div>
                            </div>
                            
                            {/* Preview of generated description */}
                            <div className="border-t pt-4">
                              <h3 className="text-sm font-medium mb-2">Vista previa de la descripción</h3>
                              <div className="p-3 bg-muted/20 rounded border text-sm">
                                {(() => {
                                  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);
                                  const { template_id, ...params } = watchedValues || {};
                                  
                                  // Convert boolean values to "Sí"/"No" for display
                                  const displayParams = { ...params };
                                  Object.keys(displayParams).forEach(key => {
                                    const param = parameters?.find(p => p.name === key);
                                    if (param?.type === 'boolean') {
                                      displayParams[key] = displayParams[key] ? 'Sí' : 'No';
                                    }
                                  });
                                  
                                  return generateDescriptionWithExpressions(displayParams);
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedTemplateId && !parametersLoading && parameters && parameters.length === 0 && (
                          <div className="space-y-4">
                            <div className="border-t pt-4">
                              <div className="p-4 border border-dashed rounded text-center text-sm text-muted-foreground">
                                Esta plantilla no tiene parámetros configurados.
                                <br />
                                La tarea se creará con la información básica de la plantilla.
                              </div>
                            </div>
                            
                            {/* Preview for templates without parameters */}
                            <div className="border-t pt-4">
                              <h3 className="text-sm font-medium mb-2">Vista previa de la descripción</h3>
                              <div className="p-3 bg-muted/20 rounded border text-sm">
                                {(() => {
                                  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);
                                  return selectedTemplate?.name_template || selectedTemplate?.name || "Vista previa no disponible";
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Segundo acordeón: Materiales */}
                    <AccordionItem value="materials">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Materiales ({taskMaterials?.length || 0})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        {/* Lista de materiales existentes */}
                        {taskMaterials && taskMaterials.length > 0 && (
                          <div className="space-y-2">
                            {taskMaterials.map((taskMaterial) => (
                              <div
                                key={taskMaterial.id}
                                className="flex items-center justify-between p-3 border border-border rounded-md bg-card"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {taskMaterial.materials?.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Cantidad: {taskMaterial.amount} {taskMaterial.materials?.units?.name}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteMaterial(taskMaterial.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formulario para agregar nuevo material */}
                        {(createdTaskId || generatedTask?.id) && (
                          <div className="space-y-3 border border-border rounded-md p-3 bg-muted/30">
                            <div className="flex items-center gap-2 mb-3">
                              <Plus className="h-4 w-4" />
                              <span className="text-sm font-medium">Agregar Material</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="material-select" className="text-xs">Material</Label>
                                <Select
                                  value={newMaterial.material_id}
                                  onValueChange={(value) => setNewMaterial(prev => ({ ...prev, material_id: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar material" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {materials?.map((material: any) => (
                                      <SelectItem key={material.id} value={material.id}>
                                        {material.name} ({material.unit?.name})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor="quantity-input" className="text-xs">Cantidad</Label>
                                <Input
                                  id="quantity-input"
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  value={newMaterial.amount}
                                  onChange={(e) => setNewMaterial(prev => ({ ...prev, amount: parseFloat(e.target.value) || 1 }))}
                                  placeholder="1"
                                />
                              </div>
                            </div>
                            
                            <Button
                              type="button"
                              onClick={handleAddMaterial}
                              disabled={!newMaterial.material_id || newMaterial.amount <= 0 || createTaskMaterial.isPending}
                              size="sm"
                              className="w-full"
                            >
                              {createTaskMaterial.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Agregando...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Agregar Material
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Mensaje cuando no hay tarea creada aún */}
                        {!createdTaskId && !generatedTask?.id && (
                          <div className="text-center text-muted-foreground text-sm py-4 border border-dashed border-border rounded-md">
                            Crea la tarea primero para poder agregar materiales
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </form>
              </Form>
            )}
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSave={existingTask ? onClose : form.handleSubmit(handleSubmit)}
            saveText={existingTask ? "Cerrar" : (isEditing ? "Actualizar Tarea Generada" : "Crear Tarea Generada")}
            saveDisabled={!selectedTemplateId || createGeneratedTask.isPending || updateGeneratedTask.isPending}
            saveLoading={createGeneratedTask.isPending || updateGeneratedTask.isPending}
          />
        )
      }}
    </CustomModalLayout>
  );
}