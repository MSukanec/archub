import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useConstructionProjectPhases } from "@/hooks/use-construction-phases";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const scheduleTaskSchema = z.object({
  start_date: z.string().optional(),
  duration_in_days: z.number().min(1, "La duración debe ser mayor a 0").optional(),
  progress_percent: z.number().min(0).max(100).optional(),
  project_phase_id: z.string().optional(),
  notes: z.string().optional()
}).refine(
  (data) => {
    // Si hay start_date, debe haber duration_in_days
    if (data.start_date && !data.duration_in_days) {
      return false;
    }
    return true;
  },
  {
    message: "Si especifica fecha de inicio, debe incluir la duración en días",
    path: ["duration_in_days"]
  }
);

type ScheduleTaskFormData = z.infer<typeof scheduleTaskSchema>;

interface ConstructionTaskScheduleModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    editingTask: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ConstructionTaskScheduleModal({ 
  modalData, 
  onClose 
}: ConstructionTaskScheduleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: userData } = useCurrentUser();
  const { data: projectPhases = [] } = useConstructionProjectPhases(modalData.projectId);
  
  const updateTask = useUpdateConstructionTask();

  // Hook para obtener la fase actual de la tarea
  const { data: currentPhaseTask, isLoading: isLoadingPhase } = useQuery({
    queryKey: ['construction-phase-task', modalData.editingTask?.id],
    queryFn: async () => {
      if (!modalData.editingTask?.id || !supabase) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('construction_phase_tasks')
        .select('project_phase_id, progress_percent')
        .eq('construction_task_id', modalData.editingTask.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current phase task:', error);
        return null;
      }

      return data;
    },
    enabled: !!modalData.editingTask?.id,
    staleTime: 0
  });

  const form = useForm<ScheduleTaskFormData>({
    resolver: zodResolver(scheduleTaskSchema),
    defaultValues: {
      start_date: "",
      duration_in_days: undefined,
      progress_percent: 0,
      project_phase_id: "",
      notes: ""
    }
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = form;

  // Cargar datos cuando el modal se abre o cambian los datos
  useEffect(() => {
    if (modalData.editingTask && !isLoadingPhase) {
      console.log('Loading schedule data for task:', modalData.editingTask);
      
      // Resetear el formulario con los datos de la tarea
      const taskData = {
        start_date: modalData.editingTask.start_date || "",
        duration_in_days: modalData.editingTask.duration_in_days || undefined,
        progress_percent: modalData.editingTask.progress_percent || 0,
        project_phase_id: currentPhaseTask?.project_phase_id || modalData.editingTask.phase_instance_id || "",
        notes: modalData.editingTask.notes || ""
      };
      
      console.log('Setting form data:', taskData);
      reset(taskData);
    }
  }, [modalData.editingTask, currentPhaseTask, isLoadingPhase, reset]);

  const onSubmit = async (data: ScheduleTaskFormData) => {
    if (!userData?.user?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Calculate end_date if start_date and duration_in_days are provided
      let endDate: string | undefined;
      if (data.start_date && data.duration_in_days) {
        const startDate = new Date(data.start_date);
        startDate.setDate(startDate.getDate() + data.duration_in_days);
        endDate = startDate.toISOString().split('T')[0];
      }

      // Update task with schedule data
      await updateTask.mutateAsync({
        id: modalData.editingTask.id,
        project_id: modalData.projectId,
        organization_id: modalData.organizationId,
        start_date: data.start_date || undefined,
        end_date: endDate || undefined,
        duration_in_days: data.duration_in_days || undefined,
        progress_percent: data.progress_percent || 0,
        project_phase_id: data.project_phase_id || undefined,

      });

      toast({
        title: "Éxito",
        description: "Cronograma de tarea actualizado correctamente",
      });

      onClose();
    } catch (error) {
      console.error('Error updating task schedule:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cronograma de la tarea",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = (
        Vista de cronograma de tareas
      </div>
    </div>
  );

  const editPanel = (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }
      }}
    >
      {/* Información de la tarea */}
          {modalData.editingTask?.task?.display_name || modalData.editingTask?.task?.code || 'Sin nombre'}
        </p>
      </div>

      {/* Fase y Progreso en línea */}
          <Label htmlFor="project_phase_id">Fase del Proyecto</Label>
          <Select 
            value={watch('project_phase_id') || ""}
            onValueChange={(value) => setValue('project_phase_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar fase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin fase asignada</SelectItem>
              {projectPhases.map((phase: any) => (
                <SelectItem key={phase.id} value={phase.id}>
                  {phase.phase?.name || 'Fase sin nombre'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.project_phase_id && (
          )}
        </div>

          <Label htmlFor="progress_percent">Progreso (%)</Label>
          <Input
            type="number"
            id="progress_percent"
            min="0"
            max="100"
            placeholder="ej: 75"
            {...register('progress_percent', { 
              valueAsNumber: true,
              setValueAs: (value) => value === "" ? 0 : Number(value)
            })}
          />
          {errors.progress_percent && (
          )}
        </div>
      </div>

      {/* Fecha de inicio y Duración en línea */}
          <Label htmlFor="start_date">Fecha de Inicio</Label>
          <Input
            type="date"
            id="start_date"
            {...register('start_date')}
          />
          {errors.start_date && (
          )}
        </div>

          <Label htmlFor="duration_in_days">Duración (días)</Label>
          <Input
            type="number"
            id="duration_in_days"
            min="1"
            placeholder="ej: 5"
            {...register('duration_in_days', { 
              valueAsNumber: true,
              setValueAs: (value) => value === "" ? undefined : Number(value)
            })}
          />
          {errors.duration_in_days && (
          )}
        </div>
      </div>

      {/* Notas */}
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          placeholder="Notas adicionales sobre el cronograma..."
          {...register('notes')}
          rows={3}
        />
        {errors.notes && (
        )}
      </div>
    </form>
  );

  const headerContent = (
    <FormModalHeader 
      icon={Calendar}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Guardar Cronograma"
      onRightClick={handleSubmit(onSubmit)}
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
      isEditing={modalData.editingTask ? true : false}
    />
  );
}