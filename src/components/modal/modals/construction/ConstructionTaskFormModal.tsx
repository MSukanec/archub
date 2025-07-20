import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { ComboBox } from "@/components/ui-custom/ComboBoxWrite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useTaskSearch } from "@/hooks/use-task-search";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useProjectPhases } from "@/hooks/use-construction-phases";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const addTaskSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  project_phase_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  duration_in_days: z.number().min(1, "La duración debe ser al menos 1 día").optional()
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

  // Get current user's member_id
  const { data: currentMember } = useQuery({
    queryKey: ['current-member', modalData.organizationId, userData?.user?.id],
    queryFn: async () => {
      if (!userData?.user?.id || !modalData.organizationId) return null;
      
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
  const { data: projectPhases = [] } = useProjectPhases(modalData.projectId);

  const form = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      task_id: modalData.editingTask?.task_id || "",
      quantity: modalData.editingTask?.quantity || 1,
      project_phase_id: "",
      start_date: modalData.editingTask?.start_date || "",
      end_date: modalData.editingTask?.end_date || "",
      duration_in_days: modalData.editingTask?.duration_in_days || undefined
    }
  });

  const { handleSubmit, setValue, watch, formState: { errors } } = form;
  const selectedTaskId = watch('task_id');

  // Cargar datos cuando está en modo edición
  useEffect(() => {
    if (modalData.isEditing && modalData.editingTask) {
      const task = modalData.editingTask;
      
      // Pre-cargar la búsqueda con el nombre de la tarea existente
      if (task.task?.display_name) {
        setSearchQuery(task.task.display_name);
      }
      
      // Actualizar los valores del formulario
      setValue('task_id', task.task_id || '');
      setValue('quantity', task.quantity || 1);
      setValue('start_date', task.start_date || '');
      setValue('end_date', task.end_date || '');
      setValue('duration_in_days', task.duration_in_days || undefined);
    }
  }, [modalData.isEditing, modalData.editingTask, setValue]);

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

      if (modalData.isEditing && modalData.editingTask?.id) {
        // Update existing task
        await updateTask.mutateAsync({
          id: modalData.editingTask.id,
          project_id: modalData.projectId,
          organization_id: modalData.organizationId,
          quantity: data.quantity,
          start_date: data.start_date || null,
          end_date: endDate || null,
          duration_in_days: data.duration_in_days || null
        });
      } else {
        // Create new task
        await createTask.mutateAsync({
          organization_id: modalData.organizationId,
          project_id: modalData.projectId,
          task_id: data.task_id,
          quantity: data.quantity,
          created_by: currentMember.id,
          project_phase_id: data.project_phase_id || undefined,
          start_date: data.start_date || null,
          end_date: endDate || null,
          duration_in_days: data.duration_in_days || null
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      {/* Date Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="start_date">Fecha de Inicio</Label>
          <Input
            type="date"
            {...form.register('start_date')}
            className="w-full"
          />
          {errors.start_date && (
            <p className="text-sm text-destructive">{errors.start_date.message}</p>
          )}
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="end_date">Fecha de Finalización</Label>
          <Input
            type="date"
            {...form.register('end_date')}
            className="w-full"
          />
          {errors.end_date && (
            <p className="text-sm text-destructive">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label htmlFor="duration_in_days">Duración (días)</Label>
        <Input
          type="number"
          min="1"
          placeholder="Ej: 5"
          {...form.register('duration_in_days', { valueAsNumber: true })}
          className="w-full"
        />
        {errors.duration_in_days && (
          <p className="text-sm text-destructive">{errors.duration_in_days.message}</p>
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
      rightLoading={isSubmitting}
      rightDisabled={isSubmitting || !selectedTaskId || !quantity}
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