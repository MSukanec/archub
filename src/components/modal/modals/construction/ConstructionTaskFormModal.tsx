import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { FormSubsectionButton } from "@/components/modal/form/FormSubsectionButton";
import { ComboBox } from "@/components/ui-custom/ComboBoxWrite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, ArrowLeft, List } from "lucide-react";
import { useTaskSearch } from "@/hooks/use-task-search";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useProjectPhases } from "@/hooks/use-construction-phases";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";

import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUnits } from "@/hooks/use-task-categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTaskTemplates, useTaskTemplateParameters } from "@/hooks/use-task-templates";
import { useCreateGeneratedTask } from "@/hooks/use-generated-tasks";
import { generatePreviewDescription } from "@/utils/taskDescriptionGenerator";
import { Switch } from "@/components/ui/switch";
import { TaskBulkSelector } from "@/components/ui-custom/TaskBulkSelector";

const addTaskSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  project_phase_id: z.string().min(1, "Debe seleccionar una fase de proyecto")
});

// Esquema para el subformulario de tarea personalizada
const customTaskSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  unit_id: z.string().min(1, "La unidad es requerida"),
});

// Esquema para el subformulario de template
const templateTaskSchema = z.object({
  template_id: z.string().min(1, "Debe seleccionar una plantilla"),
  unit_id: z.string().optional()
}).catchall(z.any());

type AddTaskFormData = z.infer<typeof addTaskSchema>;
type CustomTaskFormData = z.infer<typeof customTaskSchema>;
type TemplateTaskFormData = z.infer<typeof templateTaskSchema>;

interface ConstructionTaskFormModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
    editingTask?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ConstructionTaskFormModal({ 
  modalData, 
  onClose 
}: ConstructionTaskFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingCustomTask, setIsCreatingCustomTask] = useState(false);
  const [isCreatingTemplateTask, setIsCreatingTemplateTask] = useState(false);
  const [isBulkSelecting, setIsBulkSelecting] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [parameterOptions, setParameterOptions] = useState<Record<string, any[]>>({});
  const [bulkSelections, setBulkSelections] = useState<{taskId: string, quantity: number}[]>([]);
  
  const { data: userData } = useCurrentUser();
  const { setPanel, currentPanel } = useModalPanelStore();
  const queryClient = useQueryClient();

  // Hooks para sistema de templates
  const { data: templates, isLoading: templatesLoading } = useTaskTemplates();
  const { data: parameters, isLoading: parametersLoading, refetch: refetchParameters } = useTaskTemplateParameters(selectedTemplateId || null);
  const createGeneratedTask = useCreateGeneratedTask();





  // Get current user's member_id
  const { data: currentMember } = useQuery({
    queryKey: ['current-member', modalData.organizationId, userData?.user?.id],
    queryFn: async () => {
      if (!userData?.user?.id || !modalData.organizationId) return null;
      
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', modalData.organizationId)
        .eq('user_id', userData.user.id)
        .single();

      if (error) {
        console.error('Error fetching member:', error);
        return null;
      }

      return data;
    },
    enabled: !!userData?.user?.id && !!modalData.organizationId
  });

  // Forzar modo de edición al abrir el modal
  useEffect(() => {
    setPanel("edit");
  }, [setPanel]);

  // Hook para búsqueda de tareas (buscar siempre si hay query o si estamos editando)
  const { data: tasks = [], isLoading: tasksLoading } = useTaskSearch(
    searchQuery, 
    modalData.organizationId, 
    { origin: 'all' },
    searchQuery.length >= 3 || modalData.isEditing
  );

  // Hook para obtener las fases del proyecto
  const { data: projectPhases = [], isLoading: isLoadingProjectPhases } = useProjectPhases(modalData.projectId);

  // Hook para obtener unidades (para subformulario)
  const { data: units = [] } = useUnits();
  
  // Log para debug
  useEffect(() => {
    console.log('Project phases loaded:', projectPhases);
  }, [projectPhases]);

  // Hook para obtener la fase actual de la tarea cuando se está editando
  const { data: currentPhaseTask, isLoading: isLoadingPhase, isSuccess: phaseLoaded } = useQuery({
    queryKey: ['construction-phase-task', modalData.editingTask?.id],
    queryFn: async () => {
      if (!modalData.editingTask?.id || !supabase) {
        console.log('No task ID or supabase available for phase query');
        return null;
      }
      
      console.log('Fetching phase for task:', modalData.editingTask.id);
      
      const { data, error } = await supabase
        .from('construction_phase_tasks')
        .select('project_phase_id, progress_percent')
        .eq('construction_task_id', modalData.editingTask.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current phase task:', error);
        return null;
      }

      console.log('Phase task query result:', data);
      return data;
    },
    enabled: !!modalData.isEditing && !!modalData.editingTask?.id,
    staleTime: 0 // Always refetch to ensure we have the latest data
  });

  const form = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      task_id: "",
      quantity: 1,
      project_phase_id: ""
    }
  });

  // Formulario para el subpanel de tarea personalizada
  const customTaskForm = useForm<CustomTaskFormData>({
    resolver: zodResolver(customTaskSchema),
    defaultValues: {
      name: "",
      description: "",
      unit_id: "",
    }
  });

  // Formulario para el subpanel de template
  const templateTaskForm = useForm<TemplateTaskFormData>({
    resolver: zodResolver(templateTaskSchema),
    defaultValues: {
      template_id: "",
      ...paramValues
    },
    mode: "onBlur"
  });

  const { handleSubmit, setValue, watch, formState: { errors } } = form;
  const selectedTaskId = watch('task_id');

  // Cargar datos cuando está en modo edición
  useEffect(() => {
    if (modalData.isEditing && modalData.editingTask) {
      const task = modalData.editingTask;
      console.log('Loading task for editing:', task);
      
      // Pre-cargar la búsqueda con el nombre de la tarea existente
      if (task.task?.display_name) {
        setSearchQuery(task.task.display_name);
      }
      
      // Reset del formulario con valores básicos
      form.reset({
        task_id: task.task_id || '',
        quantity: task.quantity || 1,
        project_phase_id: currentPhaseTask?.project_phase_id || ''
      });
    }
  }, [modalData.isEditing, modalData.editingTask, currentPhaseTask, form, setSearchQuery]);





  // Agregar la tarea actual a las opciones si estamos editando y no está en la lista
  const enhancedTaskOptions = useMemo(() => {
    const baseOptions = tasks.map(task => ({
      value: task.id,
      label: task.display_name || task.code || 'Sin nombre'
    }));

    // Si estamos editando y la tarea actual no está en las opciones, agregarla
    if (modalData.isEditing && modalData.editingTask && selectedTaskId) {
      const currentTaskExists = baseOptions.some(option => option.value === selectedTaskId);
      
      if (!currentTaskExists && modalData.editingTask.task) {
        baseOptions.unshift({
          value: modalData.editingTask.task_id,
          label: modalData.editingTask.task.processed_display_name || 
                 modalData.editingTask.task.display_name || 
                 modalData.editingTask.task.code || 'Tarea actual'
        });
      }
    }

    return baseOptions;
  }, [tasks, modalData.isEditing, modalData.editingTask, selectedTaskId]);





  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const quantity = watch('quantity');
  
  // Get task unit
  const getTaskUnit = () => {
    if (!selectedTask || !selectedTask.units) return 'ud';
    return selectedTask.units.name || 'ud';
  };

  const createTask = useCreateConstructionTask();
  const updateTask = useUpdateConstructionTask();

  // Mutación para crear tarea desde template
  const createTemplateTaskMutation = useMutation({
    mutationFn: async (formData: TemplateTaskFormData) => {
      if (!userData?.organization?.id) {
        throw new Error('Información de organización no disponible');
      }

      const { template_id, ...params } = formData;

      const result = await createGeneratedTask.mutateAsync({
        template_id: template_id,
        param_values: params,
        organization_id: userData.organization.id,
        is_system: false
      });

      return result;
    },
    onSuccess: (result) => {
      if (result.new_task) {
        toast({
          title: "Tarea creada desde template",
          description: `Tarea creada exitosamente con código ${result.generated_code}`,
        });
        
        // Invalidar queries y preseleccionar nueva tarea
        queryClient.invalidateQueries({ queryKey: ['task-search'] });
        queryClient.invalidateQueries({ queryKey: ['task-generated'] });
        
        setValue('task_id', result.new_task.id);
        setSearchQuery(result.new_task.name);
        
        // Resetear y volver al panel principal
        templateTaskForm.reset();
        setPanel('edit');
        setIsCreatingTemplateTask(false);
        setSelectedTemplateId("");
        setParamValues({});
      }
    },
    onError: (error) => {
      console.error('Error creating template task:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarea desde el template",
        variant: "destructive",
      });
    },
  });

  // Mutación para crear tarea personalizada
  const createCustomTaskMutation = useMutation({
    mutationFn: async (formData: CustomTaskFormData) => {
      if (!supabase || !userData?.user?.id || !modalData.organizationId) {
        throw new Error('Datos de usuario no disponibles');
      }

      const { data, error } = await supabase
        .from('task_generated')
        .insert({
          name: formData.name,
          description: formData.description || null,
          unit_id: formData.unit_id,
          organization_id: modalData.organizationId,
          template_id: null,
          code: `CUSTOM-${Date.now()}`, // Código temporal para tareas personalizadas
          param_values: {},
          is_public: false,
          is_system: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Tarea personalizada creada",
        description: "La tarea se creó correctamente y está disponible para selección",
      });
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['task-search'] });
      queryClient.invalidateQueries({ queryKey: ['task-generated'] });
      
      // Preseleccionar la nueva tarea en el formulario principal
      setValue('task_id', data.id);
      setSearchQuery(data.name);
      
      // Resetear formulario del subpanel y volver al panel principal
      customTaskForm.reset();
      setPanel('edit');
      setIsCreatingCustomTask(false);
    },
    onError: (error) => {
      console.error('Error creating custom task:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarea personalizada",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AddTaskFormData) => {
    if (!userData?.user?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive",
      });
      return;
    }

    if (!currentMember?.id && !modalData.isEditing) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información del usuario en la organización",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (modalData.isEditing && modalData.editingTask?.id) {
        // Update existing task
        await updateTask.mutateAsync({
          id: modalData.editingTask.id,
          project_id: modalData.projectId,
          organization_id: modalData.organizationId,
          quantity: data.quantity,
          project_phase_id: data.project_phase_id || undefined
        });
      } else {
        // Create new task
        await createTask.mutateAsync({
          organization_id: modalData.organizationId,
          project_id: modalData.projectId,
          task_id: data.task_id,
          quantity: data.quantity,
          created_by: currentMember?.id || '',
          project_phase_id: data.project_phase_id || undefined
        });
      }

      onClose();
    } catch (error) {
      // Error already handled in the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = (
    <div className="space-y-6">
      <div className="text-center py-8 text-muted-foreground">
        Vista de tareas de construcción
      </div>
    </div>
  );

  const editPanel = (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-6"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }
      }}
    >
      {/* Phase Selection */}
      <div className="space-y-2">
        <Label htmlFor="project_phase_id">Fase del Proyecto *</Label>
        <Select 
          value={watch('project_phase_id') || ""}
          onValueChange={(value) => setValue('project_phase_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar fase del proyecto" />
          </SelectTrigger>
          <SelectContent>
            {projectPhases.map((projectPhase) => (
              <SelectItem key={projectPhase.id} value={projectPhase.id}>
                {projectPhase.phase.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.project_phase_id && (
          <p className="text-sm text-destructive">{errors.project_phase_id.message}</p>
        )}
      </div>

      {/* Task Selection */}
      <div className="space-y-2">
        <Label htmlFor="task_id">Tarea *</Label>
        <div className="w-full">
          <ComboBox
            options={enhancedTaskOptions}
            value={selectedTaskId}
            onValueChange={(value) => setValue('task_id', value)}
            placeholder="Buscar tarea..."
            searchPlaceholder="Escriba para buscar tareas..."
            emptyMessage="No se encontraron tareas"
            onSearchChange={setSearchQuery}
            searchQuery={searchQuery}
          />
        </div>
        {errors.task_id && (
          <p className="text-sm text-destructive">{errors.task_id.message}</p>
        )}
        
        {/* Botones para crear nuevas tareas */}
        <div className="grid gap-3">
          <FormSubsectionButton
            icon={<Wrench />}
            title="Crear desde plantilla"
            description="Crea una tarea desde una plantilla existente"
            onClick={() => {
              setIsCreatingTemplateTask(true);
              setPanel('subform');
            }}
          />
          
          <FormSubsectionButton
            icon={<Wrench />}
            title="Crear tarea personalizada"
            description="Crea una nueva tarea completamente personalizada"
            onClick={() => {
              setIsCreatingCustomTask(true);
              setPanel('subform');
            }}
          />
          
          <FormSubsectionButton
            icon={<List />}
            title="Selección en bulk"
            description="Selecciona múltiples tareas de una vez con cantidades"
            onClick={() => {
              setIsBulkSelecting(true);
              setPanel('subform');
            }}
          />
        </div>
      </div>

      {/* Quantity with Unit */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Cantidad *</Label>
        <div className="relative">
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0.01"
            value={quantity}
            onChange={(e) => setValue('quantity', parseFloat(e.target.value) || 0)}
            placeholder="Ingrese cantidad"
            className="pr-16"
          />
          {selectedTaskId && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              {getTaskUnit()}
            </div>
          )}
        </div>
        {errors.quantity && (
          <p className="text-sm text-destructive">{errors.quantity.message}</p>
        )}
      </div>
    </form>
  );

  // Función para manejar el envío del subformulario
  const onCustomTaskSubmit = (data: CustomTaskFormData) => {
    createCustomTaskMutation.mutate(data);
  };

  // Funciones de envío
  const onTemplateTaskSubmit = (data: TemplateTaskFormData) => {
    createTemplateTaskMutation.mutate(data);
  };

  // Función para manejar envío de selecciones en bulk
  const onBulkSubmit = async () => {
    if (bulkSelections.length === 0) {
      toast({
        title: "Advertencia",
        description: "No hay tareas seleccionadas",
        variant: "destructive"
      });
      return;
    }

    if (!userData?.user?.id || !currentMember?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive"
      });
      return;
    }

    // Obtener la fase seleccionada del formulario principal
    const phaseId = watch('project_phase_id');
    if (!phaseId) {
      toast({
        title: "Error", 
        description: "Debe seleccionar una fase del proyecto primero",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Crear todas las tareas en paralelo
      await Promise.all(
        bulkSelections.map(selection => 
          createTask.mutateAsync({
            organization_id: modalData.organizationId,
            project_id: modalData.projectId,
            task_id: selection.taskId,
            quantity: selection.quantity,
            created_by: currentMember.id,
            project_phase_id: phaseId
          })
        )
      );

      toast({
        title: "Éxito",
        description: `Se agregaron ${bulkSelections.length} tareas correctamente`,
      });

      onClose();
    } catch (error) {
      console.error('Error creating bulk tasks:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Panel del subformulario (templates, personalizada o bulk selection)
  const subformPanel = isBulkSelecting ? (
    // Subformulario para selección en bulk
    <div className="space-y-6">
      {/* Botón para volver */}
      <div className="flex items-center space-x-2 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setPanel('edit');
            setIsBulkSelecting(false);
            setBulkSelections([]);
          }}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a selección de tareas</span>
        </Button>
      </div>

      {/* Componente de selección en bulk */}
      <TaskBulkSelector
        organizationId={modalData.organizationId}
        selections={bulkSelections}
        onSelectionChange={setBulkSelections}
      />

      {/* Botones de acción */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPanel('edit');
            setIsBulkSelecting(false);
            setBulkSelections([]);
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onBulkSubmit}
          disabled={isSubmitting || bulkSelections.length === 0}
        >
          {isSubmitting ? "Creando tareas..." : `Agregar ${bulkSelections.length} tareas`}
        </Button>
      </div>
    </div>
  ) : isCreatingTemplateTask ? (
    // Subformulario para crear tarea desde template
    <form 
      onSubmit={templateTaskForm.handleSubmit(onTemplateTaskSubmit)} 
      className="space-y-6"
    >
      {/* Botón para volver */}
      <div className="flex items-center space-x-2 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setPanel('edit');
            setIsCreatingTemplateTask(false);
            setSelectedTemplateId("");
            setParamValues({});
          }}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a selección de tareas</span>
        </Button>
      </div>

      {/* Selector de template */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="template_id">Plantilla de Tarea *</Label>
          <Select 
            value={selectedTemplateId} 
            onValueChange={(value) => {
              setSelectedTemplateId(value);
              templateTaskForm.setValue('template_id', value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar plantilla" />
            </SelectTrigger>
            <SelectContent>
              {templatesLoading ? (
                <SelectItem value="" disabled>Cargando plantillas...</SelectItem>
              ) : (
                templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name_template}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {templateTaskForm.formState.errors.template_id && (
            <p className="text-sm text-destructive">
              {templateTaskForm.formState.errors.template_id.message}
            </p>
          )}
        </div>

        {/* Parámetros dinámicos del template */}
        {selectedTemplateId && Array.isArray(parameters) && parameters.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Parámetros del Template</h4>
            {parameters.map((param) => (
              <div key={param.id} className="space-y-2">
                <Label htmlFor={param.name}>{param.label}</Label>
                {param.type === 'select' ? (
                  <Select 
                    value={templateTaskForm.watch(param.name) || ""} 
                    onValueChange={(value) => {
                      templateTaskForm.setValue(param.name, value);
                      setParamValues(prev => ({ ...prev, [param.name]: value }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Seleccionar ${param.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {parameterOptions[param.id]?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : param.type === 'boolean' ? (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={templateTaskForm.watch(param.name) || false}
                      onCheckedChange={(checked) => {
                        templateTaskForm.setValue(param.name, checked);
                        setParamValues(prev => ({ ...prev, [param.name]: checked }));
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {templateTaskForm.watch(param.name) ? 'Sí' : 'No'}
                    </span>
                  </div>
                ) : (
                  <Input
                    type={param.type === 'number' ? 'number' : 'text'}
                    placeholder={param.label}
                    {...templateTaskForm.register(param.name)}
                    onChange={(e) => {
                      const value = param.type === 'number' ? Number(e.target.value) : e.target.value;
                      templateTaskForm.setValue(param.name, value);
                      setParamValues(prev => ({ ...prev, [param.name]: value }));
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Vista previa de descripción */}
        {selectedTemplateId && Array.isArray(parameters) && (
          <div className="space-y-2">
            <Label>Vista Previa</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                {generatePreviewDescription(
                  templates?.find(t => t.id === selectedTemplateId)?.name_template || '',
                  paramValues,
                  parameters,
                  parameterOptions
                )}
              </p>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              templateTaskForm.reset();
              setPanel('edit');
              setIsCreatingTemplateTask(false);
              setSelectedTemplateId("");
              setParamValues({});
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createTemplateTaskMutation.isPending || !selectedTemplateId}
          >
            {createTemplateTaskMutation.isPending ? "Creando..." : "Crear Tarea"}
          </Button>
        </div>
      </div>
    </form>
  ) : (
    // Subformulario para crear tarea personalizada
    <form 
      onSubmit={customTaskForm.handleSubmit(onCustomTaskSubmit)} 
      className="space-y-6"
    >
      {/* Botón para volver */}
      <div className="flex items-center space-x-2 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setPanel('edit');
            setIsCreatingCustomTask(false);
          }}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a selección de tareas</span>
        </Button>
      </div>

      {/* Campos del formulario para tarea personalizada */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="custom_name">Nombre de la Tarea *</Label>
          <Input
            id="custom_name"
            placeholder="Ej: Instalación de ventanas personalizadas"
            {...customTaskForm.register('name')}
          />
          {customTaskForm.formState.errors.name && (
            <p className="text-sm text-destructive">
              {customTaskForm.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom_description">Descripción</Label>
          <Textarea
            id="custom_description"
            placeholder="Descripción detallada de la tarea (opcional)"
            rows={3}
            {...customTaskForm.register('description')}
          />
          {customTaskForm.formState.errors.description && (
            <p className="text-sm text-destructive">
              {customTaskForm.formState.errors.description.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom_unit_id">Unidad de Medida *</Label>
          <Select 
            value={customTaskForm.watch('unit_id') || ""} 
            onValueChange={(value) => customTaskForm.setValue('unit_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar unidad" />
            </SelectTrigger>
            <SelectContent>
              {units?.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name} ({unit.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {customTaskForm.formState.errors.unit_id && (
            <p className="text-sm text-destructive">
              {customTaskForm.formState.errors.unit_id.message}
            </p>
          )}
        </div>

        {/* Botón de crear */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              customTaskForm.reset();
              setPanel('edit');
              setIsCreatingCustomTask(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createCustomTaskMutation.isPending}
          >
            {createCustomTaskMutation.isPending ? "Creando..." : "Crear Tarea"}
          </Button>
        </div>
      </div>
    </form>
  );

  // Cargar opciones para parámetros de tipo select
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

  // Reset form when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', selectedTemplateId] });
      refetchParameters();
      
      const newParamValues: Record<string, any> = {};
      if (Array.isArray(parameters)) {
        parameters.forEach(param => {
          if (param.type === 'boolean') {
            newParamValues[param.name] = false;
          } else {
            newParamValues[param.name] = '';
          }
        });
      }
      setParamValues(newParamValues);
      
      setTimeout(() => {
        templateTaskForm.reset({
          template_id: selectedTemplateId,
          ...newParamValues
        });
      }, 50);
    }
  }, [selectedTemplateId, parameters, refetchParameters]);

  const getSubformTitle = () => {
    if (currentPanel !== 'subform') return "";
    if (isCreatingTemplateTask) return "Crear desde Plantilla";
    if (isCreatingCustomTask) return "Nueva Tarea Personalizada";
    return "";
  };

  const headerContent = (
    <FormModalHeader 
      title={
        currentPanel === 'subform' 
          ? getSubformTitle()
          : modalData.isEditing 
          ? "Editar Tarea de Construcción" 
          : "Agregar Tarea de Construcción"
      }
      icon={currentPanel === 'subform' ? Wrench : Wrench}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={modalData.isEditing ? "Guardar Cambios" : "Agregar Tarea"}
      onRightClick={handleSubmit(onSubmit)}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      subformPanel={subformPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}