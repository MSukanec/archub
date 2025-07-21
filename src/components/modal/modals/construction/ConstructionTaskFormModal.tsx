import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { ComboBox } from "@/components/ui-custom/ComboBoxWrite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar } from "lucide-react";
import { useTaskSearch } from "@/hooks/use-task-search";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask, useConstructionTasks } from "@/hooks/use-construction-tasks";
import { useProjectPhases } from "@/hooks/use-construction-phases";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";
import { useConstructionDependencies, useCreateConstructionDependency, useUpdateConstructionDependency, useDeleteConstructionDependency, detectCircularDependency } from "@/hooks/use-construction-dependencies";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const addTaskSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  project_phase_id: z.string().optional(),
  progress_percent: z.number().min(0).max(100).optional().default(0),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  duration_in_days: z.number().min(1, "La duración debe ser al menos 1 día").optional(),
  // Campos de dependencias
  predecessor_task_id: z.string().optional(),
  dependency_type: z.string().optional(),
  lag_days: z.number().min(0, "El desfase debe ser 0 o mayor").optional()
});

type AddTaskFormData = z.infer<typeof addTaskSchema>;

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
  
  const { data: userData } = useCurrentUser();
  const { setPanel } = useModalPanelStore();

  // Obtener tareas del proyecto para dependencias
  const { data: projectTasks = [] } = useConstructionTasks(modalData.projectId, modalData.organizationId);
  const { data: existingDependencies = [] } = useConstructionDependencies(modalData.projectId);

  // Mutaciones para dependencias
  const createDependencyMutation = useCreateConstructionDependency();
  const updateDependencyMutation = useUpdateConstructionDependency();
  const deleteDependencyMutation = useDeleteConstructionDependency();

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
      project_phase_id: "",
      progress_percent: 0,
      start_date: "",
      end_date: "",
      duration_in_days: undefined,
      // Campos de dependencias
      predecessor_task_id: "",
      dependency_type: "FS",
      lag_days: 0
    }
  });

  const { handleSubmit, setValue, watch, formState: { errors } } = form;
  const selectedTaskId = watch('task_id');

  // Cargar datos cuando está en modo edición - reset completo del formulario
  useEffect(() => {
    if (modalData.isEditing && modalData.editingTask) {
      const task = modalData.editingTask;
      console.log('Loading task for editing:', task);
      
      // Pre-cargar la búsqueda con el nombre de la tarea existente
      if (task.task?.display_name) {
        setSearchQuery(task.task.display_name);
      }
      
      // Reset completo del formulario con todos los valores
      form.reset({
        task_id: task.task_id || '',
        quantity: task.quantity || 1,
        project_phase_id: currentPhaseTask?.project_phase_id || '',
        progress_percent: task.progress_percent || currentPhaseTask?.progress_percent || 0,
        start_date: task.start_date || '',
        end_date: task.end_date || '',
        duration_in_days: task.duration_in_days || undefined,
        predecessor_task_id: '',
        dependency_type: 'FS',
        lag_days: 0
      });
    }
  }, [modalData.isEditing, modalData.editingTask, currentPhaseTask, form, setSearchQuery]);

  // Cargar dependencia existente cuando estamos editando
  useEffect(() => {
    if (modalData.isEditing && modalData.editingTask?.id && existingDependencies.length >= 0) {
      const existingDependency = existingDependencies.find(
        dep => dep.successor_task_id === modalData.editingTask.id
      );
      
      if (existingDependency) {
        setValue('predecessor_task_id', existingDependency.predecessor_task_id);
        setValue('dependency_type', existingDependency.type);
        setValue('lag_days', existingDependency.lag_days || 0);
      }
    }
  }, [modalData.isEditing, modalData.editingTask?.id, existingDependencies, setValue]);

  // Limpiar fecha de inicio cuando se selecciona tarea predecesora
  useEffect(() => {
    const predecessorTask = watch('predecessor_task_id');
    if (predecessorTask) {
      // Si hay tarea predecesora, limpiar la fecha de inicio
      setValue('start_date', '');
    }
  }, [watch('predecessor_task_id'), setValue]);

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
      // Calculate end_date if start_date and duration_in_days are provided
      let endDate = data.end_date;
      if (data.start_date && data.duration_in_days && !data.end_date) {
        const startDate = new Date(data.start_date);
        startDate.setDate(startDate.getDate() + data.duration_in_days);
        endDate = startDate.toISOString().split('T')[0];
      }

      let taskId: string;

      if (modalData.isEditing && modalData.editingTask?.id) {
        // Update existing task
        await updateTask.mutateAsync({
          id: modalData.editingTask.id,
          project_id: modalData.projectId,
          organization_id: modalData.organizationId,
          quantity: data.quantity,
          project_phase_id: data.project_phase_id || undefined,
          progress_percent: data.progress_percent || 0,
          start_date: data.start_date || undefined,
          end_date: endDate || undefined,
          duration_in_days: data.duration_in_days || undefined
        });
        taskId = modalData.editingTask.id;
      } else {
        // Create new task
        const newTask = await createTask.mutateAsync({
          organization_id: modalData.organizationId,
          project_id: modalData.projectId,
          task_id: data.task_id,
          quantity: data.quantity,
          created_by: currentMember?.id || '',
          project_phase_id: data.project_phase_id || undefined,
          progress_percent: data.progress_percent || 0,
          start_date: data.start_date || undefined,
          end_date: endDate || undefined,
          duration_in_days: data.duration_in_days || undefined
        });
        taskId = newTask.id;
      }

      // Manejar dependencias
      if (data.predecessor_task_id && data.predecessor_task_id !== 'empty-placeholder') {
        // Buscar si ya existe una dependencia para esta tarea
        const existingDependency = existingDependencies.find(
          dep => dep.successor_task_id === taskId
        );

        if (existingDependency) {
          // Actualizar dependencia existente
          await updateDependencyMutation.mutateAsync({
            id: existingDependency.id,
            predecessor_task_id: data.predecessor_task_id,
            type: data.dependency_type || "FS",
            lag_days: data.lag_days || 0
          });
        } else {
          // Crear nueva dependencia
          await createDependencyMutation.mutateAsync({
            predecessor_task_id: data.predecessor_task_id,
            successor_task_id: taskId,
            type: data.dependency_type || "FS",
            lag_days: data.lag_days || 0
          });
        }
      } else {
        // Si no hay predecesora pero existía antes, eliminar la dependencia
        const existingDependency = existingDependencies.find(
          dep => dep.successor_task_id === taskId
        );
        
        if (existingDependency) {
          await deleteDependencyMutation.mutateAsync(existingDependency.id);
        }
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

      {/* Cronograma de Tarea Section */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-medium text-foreground">Cronograma de Tarea</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Detalles específicos del cronograma de construcción
        </span>
        
        {/* Phase Selection */}
        <div className="space-y-2">
          <Label htmlFor="project_phase_id">Fase del Proyecto</Label>
          <Select 
            value={watch('project_phase_id') || ""}
            onValueChange={(value) => setValue('project_phase_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar fase (opcional)" />
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

        {/* Progress Percentage */}
        <div className="space-y-2">
          <Label htmlFor="progress_percent">Progreso (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            placeholder="0"
            value={watch('progress_percent') || ''}
            onChange={(e) => setValue('progress_percent', parseInt(e.target.value) || 0)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Porcentaje de progreso completado de la tarea (0-100%)
          </p>
          {errors.progress_percent && (
            <p className="text-sm text-destructive">{errors.progress_percent.message}</p>
          )}
        </div>

        {/* Predecessor Task */}
        <div className="space-y-2">
          <Label htmlFor="predecessor_task_id">Tarea Predecesora</Label>
          <Select 
            value={watch('predecessor_task_id') || ""}
            onValueChange={(value) => {
              const selectedPredecessor = value || "";
              
              // Validar dependencias circulares antes de establecer
              if (selectedPredecessor && modalData.editingTask?.id) {
                const wouldCreateCycle = detectCircularDependency(
                  selectedPredecessor,
                  modalData.editingTask.id,
                  existingDependencies
                );
                
                if (wouldCreateCycle) {
                  toast({
                    title: "Error",
                    description: "Esta dependencia crearía un ciclo. Una tarea no puede depender de sí misma o crear dependencias circulares.",
                    variant: "destructive"
                  });
                  return;
                }
              }
              
              setValue('predecessor_task_id', selectedPredecessor);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tarea predecesora (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin dependencia</SelectItem>
              {projectTasks
                .filter(task => 
                  // Filtrar la tarea actual si estamos editando
                  modalData.isEditing ? task.id !== modalData.editingTask?.id : true
                )
                .map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.task.code} - {task.task.display_name.slice(0, 50)}
                    {task.task.display_name.length > 50 ? '...' : ''}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.predecessor_task_id && (
            <p className="text-sm text-destructive">{errors.predecessor_task_id.message}</p>
          )}
        </div>

        {/* Start Date - solo si NO hay tarea predecesora */}
        {!watch('predecessor_task_id') && (
          <div className="space-y-2">
            <Label htmlFor="start_date">Fecha de Inicio</Label>
            <Input
              type="date"
              value={watch('start_date') || ''}
              onChange={(e) => setValue('start_date', e.target.value)}
              className="w-full"
            />
            {errors.start_date && (
              <p className="text-sm text-destructive">{errors.start_date.message}</p>
            )}
          </div>
        )}

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration_in_days">Cantidad de Días</Label>
          <Input
            type="number"
            min="1"
            placeholder="Ej: 5"
            value={watch('duration_in_days') || ''}
            onChange={(e) => setValue('duration_in_days', parseInt(e.target.value) || 1)}
            className="w-full"
          />
          {errors.duration_in_days && (
            <p className="text-sm text-destructive">{errors.duration_in_days.message}</p>
          )}
        </div>

        {/* Dependency Type */}
        {watch('predecessor_task_id') && (
          <div className="space-y-2">
            <Label htmlFor="dependency_type">Tipo de Dependencia</Label>
            <Select 
              value={watch('dependency_type') || "FS"}
              onValueChange={(value) => setValue('dependency_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FS">FS (Finish-to-Start) - Inicia cuando termina la anterior</SelectItem>
              </SelectContent>
            </Select>
            {errors.dependency_type && (
              <p className="text-sm text-destructive">{errors.dependency_type.message}</p>
            )}
          </div>
        )}

        {/* Lag Days */}
        {watch('predecessor_task_id') && (
          <div className="space-y-2">
            <Label htmlFor="lag_days">Desfase en días</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={watch('lag_days') || ''}
              onChange={(e) => setValue('lag_days', parseInt(e.target.value) || 0)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Días adicionales de espera después de completar la tarea predecesora
            </p>
            {errors.lag_days && (
              <p className="text-sm text-destructive">{errors.lag_days.message}</p>
            )}
          </div>
        )}
      </div>
    </form>
  );

  const headerContent = (
    <FormModalHeader 
      title={modalData.isEditing ? "Editar Tarea de Construcción" : "Agregar Tarea de Construcción"}
      icon={Plus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={modalData.isEditing ? "Guardar Cambios" : "Agregar Tarea"}
      onRightClick={handleSubmit(onSubmit)}
      disabled={isSubmitting || !selectedTaskId || !quantity}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}