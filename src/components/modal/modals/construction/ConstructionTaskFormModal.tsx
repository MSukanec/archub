import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

import { ComboBox } from "@/components/ui-custom/ComboBoxWrite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useTaskSearch } from "@/hooks/use-task-search";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useProjectPhases } from "@/hooks/use-construction-phases";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";

import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const addTaskSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  project_phase_id: z.string().min(1, "Debe seleccionar una fase de proyecto")
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
  const { data: currentPhaseTask } = useQuery({
    queryKey: ['current-phase-task', modalData.editingTask?.id],
    queryFn: async () => {
      if (!modalData.editingTask?.id || !supabase) return null;

      const { data, error } = await supabase
        .from('construction_task_instances')
        .select('project_phase_id')
        .eq('id', modalData.editingTask.id)
        .single();

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

  const onSubmit = async (data: AddTaskFormData) => {
    if (!userData?.user?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive"
      });
      return;
    }

    if (!currentMember?.id) {
      toast({
        title: "Error", 
        description: "No se pudo identificar el miembro de la organización",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (modalData.isEditing && modalData.editingTask) {
        // Modo edición
        await updateTask.mutateAsync({
          id: modalData.editingTask.id,
          task_id: data.task_id,
          quantity: data.quantity,
          project_phase_id: data.project_phase_id
        });

        toast({
          title: "Tarea actualizada",
          description: "La tarea se ha actualizado correctamente",
        });
      } else {
        // Modo creación
        await createTask.mutateAsync({
          organization_id: modalData.organizationId,
          project_id: modalData.projectId,
          task_id: data.task_id,
          quantity: data.quantity,
          created_by: currentMember.id,
          project_phase_id: data.project_phase_id
        });

        toast({
          title: "Tarea agregada",
          description: "La tarea se ha agregado correctamente al proyecto",
        });
      }

      onClose();
    } catch (error) {
      console.error('Error submitting task:', error);
      toast({
        title: "Error",
        description: modalData.isEditing ? "No se pudo actualizar la tarea" : "No se pudo agregar la tarea",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Panel de vista (vacío para este modal)
  const viewPanel = (
    <div className="p-4 text-center text-muted-foreground">
      Este modal no tiene vista previa
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
        <Label htmlFor="project_phase_id">Fase de Proyecto *</Label>
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

  const headerContent = (
    <FormModalHeader 
      title={modalData.isEditing ? "Editar Tarea de Construcción" : "Agregar Tarea de Construcción"}
      icon={Settings}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={modalData.isEditing ? "Guardar Cambios" : "Agregar Tarea"}
      onRightClick={handleSubmit(onSubmit)}
      rightLoading={isSubmitting}
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