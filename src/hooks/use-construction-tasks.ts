import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface ConstructionTask {
  id: string;
  organization_id: string;
  project_id: string;
  task_id: string;
  quantity: number;
  created_by: string;
  start_date?: string;
  end_date?: string;
  duration_in_days?: number;
  created_at: string;
  updated_at: string;
  task: {
    id: string;
    code: string;
    display_name: string;
    rubro_name: string | null;
    category_name: string | null;
    unit_id: string | null;
    unit_name?: string | null;
    rubro_id: string | null;
    param_values: any;
  };

  phase_name?: string;
  progress_percent?: number;
}

export function useConstructionTasks(projectId: string, organizationId: string) {
  return useQuery({
    queryKey: ['construction-tasks', projectId, organizationId],
    queryFn: async (): Promise<ConstructionTask[]> => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Primero obtener las tareas
      const { data: tasksData, error: tasksError } = await supabase
        .from('construction_tasks')
        .select(`
          *,
          task:task_generated_view!inner (
            id,
            code,
            display_name,
            rubro_name,
            category_name,
            unit_id,
            rubro_id,
            param_values
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching construction tasks:', tasksError);
        throw tasksError;
      }

      if (!tasksData || tasksData.length === 0) {
        return [];
      }

      // Obtener las fases para cada tarea usando consultas separadas
      const taskIds = tasksData.map(task => task.id);
      
      // Primero obtener las relaciones fase-tarea con progreso
      const { data: phaseTasksData, error: phaseTasksError } = await supabase
        .from('construction_phase_tasks')
        .select('construction_task_id, project_phase_id, progress_percent')
        .in('construction_task_id', taskIds);

      // Crear mapas de task_id -> project_phase_id y task_id -> progress_percent
      const taskPhaseMap: Record<string, string> = {};
      const taskProgressMap: Record<string, number> = {};
      if (phaseTasksData && !phaseTasksError) {
        phaseTasksData.forEach(pt => {
          taskPhaseMap[pt.construction_task_id] = pt.project_phase_id;
          taskProgressMap[pt.construction_task_id] = pt.progress_percent || 0;
        });
      }

      // Obtener los nombres de las fases
      const projectPhaseIds = Object.values(taskPhaseMap);
      let phaseNamesMap: Record<string, string> = {};
      
      if (projectPhaseIds.length > 0) {
        const { data: projectPhasesData, error: projectPhasesError } = await supabase
          .from('construction_project_phases')
          .select(`
            id,
            phase:construction_phases!inner (name)
          `)
          .in('id', projectPhaseIds);

        if (projectPhasesData && !projectPhasesError) {
          phaseNamesMap = {};
          projectPhasesData.forEach(pp => {
            phaseNamesMap[pp.id] = (pp.phase as any)?.name || '';
          });
        }
      }

      // Obtener información de las unidades para todos los unit_id
      const unitIds = Array.from(new Set(tasksData.map(task => task.task.unit_id).filter(Boolean)));
      let unitsMap: Record<string, string> = {};
      
      if (unitIds.length > 0) {
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select('id, name')
          .in('id', unitIds);
          
        if (unitsData && !unitsError) {
          unitsData.forEach(unit => {
            unitsMap[unit.id] = unit.name;
          });
        }
      }

      // Procesar los datos para agregar el nombre de la fase, progreso y unidad
      const processedData = tasksData.map(task => {
        const projectPhaseId = taskPhaseMap[task.id];
        const phaseName = projectPhaseId ? phaseNamesMap[projectPhaseId] : null;
        const progressPercent = taskProgressMap[task.id] || 0;
        const unitName = task.task.unit_id ? unitsMap[task.task.unit_id] : null;
        
        return {
          ...task,
          phase_name: phaseName || null,
          progress_percent: progressPercent,
          task: {
            ...task.task,
            unit_name: unitName || null
          }
        };
      });

      return processedData;
    },
    enabled: !!projectId && !!organizationId,
  });
}

export function useCreateConstructionTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: {
      organization_id: string;
      project_id: string;
      task_id: string;
      quantity: number;
      created_by: string;
      start_date?: string;
      end_date?: string;
      duration_in_days?: number;
      project_phase_id?: string; // ID de la fase del proyecto (construction_project_phases.id)
      progress_percent?: number;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      // Crear la tarea de construcción
      const { data: constructionTask, error: taskError } = await supabase
        .from('construction_tasks')
        .insert({
          organization_id: taskData.organization_id,
          project_id: taskData.project_id,
          task_id: taskData.task_id,
          quantity: taskData.quantity,
          created_by: taskData.created_by,
          start_date: taskData.start_date,
          end_date: taskData.end_date,
          duration_in_days: taskData.duration_in_days,
        })
        .select(`
          *,
          task:task_generated_view!inner (
            id,
            code,
            display_name,
            rubro_name,
            category_name,
            unit_id,
            rubro_id
          )
        `)
        .single();

      if (taskError) {
        console.error('Error creating construction task:', taskError);
        throw taskError;
      }

      // Si se especificó una fase, crear la vinculación en construction_phase_tasks
      if (taskData.project_phase_id && constructionTask) {
        const { error: phaseTaskError } = await supabase
          .from('construction_phase_tasks')
          .insert({
            construction_task_id: constructionTask.id,
            project_phase_id: taskData.project_phase_id,
            progress_percent: taskData.progress_percent || 0,
          });

        if (phaseTaskError) {
          console.error('Error linking task to phase:', phaseTaskError);
          // No lanzamos error aquí para que la tarea se cree aunque falle la vinculación
        }
      }

      return constructionTask;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks', data.project_id, data.organization_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['construction-phase-task'] 
      });
      // Invalidar cache de materiales para que se actualice automáticamente
      queryClient.invalidateQueries({ 
        queryKey: ['construction-materials', data.project_id] 
      });
      toast({
        title: "Tarea agregada",
        description: "La tarea se agregó correctamente al proyecto",
      });
    },
    onError: (error) => {
      console.error('Error adding construction task:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la tarea",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateConstructionTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      quantity?: number;
      project_id: string;
      organization_id: string;
      start_date?: string;
      end_date?: string;
      duration_in_days?: number;
      project_phase_id?: string;
      progress_percent?: number;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.start_date !== undefined) updateData.start_date = data.start_date;
      if (data.end_date !== undefined) updateData.end_date = data.end_date;
      if (data.duration_in_days !== undefined) updateData.duration_in_days = data.duration_in_days;

      const { data: result, error } = await supabase
        .from('construction_tasks')
        .update(updateData)
        .eq('id', data.id)
        .select(`
          *,
          task:task_generated_view!inner (
            id,
            code,
            display_name,
            rubro_name,
            category_name,
            unit_id,
            rubro_id
          )
        `)
        .single();

      if (error) {
        console.error('Error updating construction task:', error);
        throw error;
      }

      // Manejar la vinculación con la fase
      if (data.project_phase_id !== undefined) {
        // Primero eliminar cualquier vinculación existente
        await supabase
          .from('construction_phase_tasks')
          .delete()
          .eq('construction_task_id', data.id);

        // Si se especifica una fase, crear nueva vinculación
        if (data.project_phase_id) {
          const { error: phaseTaskError } = await supabase
            .from('construction_phase_tasks')
            .insert({
              construction_task_id: data.id,
              project_phase_id: data.project_phase_id,
              progress_percent: data.progress_percent || 0,
            });

          if (phaseTaskError) {
            console.error('Error linking task to phase:', phaseTaskError);
            // No lanzamos error aquí para que la actualización continúe
          }
        }
      } else if (data.progress_percent !== undefined) {
        // Si solo se actualiza el progreso, hacer un update en place
        const { error: progressError } = await supabase
          .from('construction_phase_tasks')
          .update({
            progress_percent: data.progress_percent
          })
          .eq('construction_task_id', data.id);

        if (progressError) {
          console.error('Error updating progress:', progressError);
        }
      }

      return result;
    },
    onSuccess: (data) => {
      // Invalidar todas las queries relacionadas con tareas de construcción
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks', data.project_id, data.organization_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['construction-phase-task'] 
      });
      // Invalidar cache de materiales para que se actualice automáticamente
      queryClient.invalidateQueries({ 
        queryKey: ['construction-materials', data.project_id] 
      });
      // También invalidar las queries de dependencias por si afectan al Gantt
      queryClient.invalidateQueries({ 
        queryKey: ['construction-dependencies'] 
      });
      toast({
        title: "Tarea actualizada",
        description: "Los cambios se guardaron correctamente",
      });
    },
    onError: (error) => {
      console.error('Error updating construction task:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    },
  });
}

// Hook específico para redimensionamiento de barras sin toast ni refetch excesivo
export function useUpdateConstructionTaskResize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      start_date?: string;
      end_date?: string;
      duration_in_days?: number;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.start_date !== undefined) updateData.start_date = data.start_date;
      if (data.end_date !== undefined) updateData.end_date = data.end_date;
      if (data.duration_in_days !== undefined) updateData.duration_in_days = data.duration_in_days;

      const { data: result, error } = await supabase
        .from('construction_tasks')
        .update(updateData)
        .eq('id', data.id)
        .select('id, project_id, organization_id')
        .single();

      if (error) {
        console.error('Error updating construction task:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (data) => {
      // Para resize: invalidar queries para refrescar inmediatamente
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks', data.project_id, data.organization_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['construction-dependencies'] 
      });
    },
    onError: (error) => {
      console.error('Error updating construction task:', error);
      // Sin toast para redimensionamiento - feedback visual suficiente
    },
  });
}

// Hook específico para drag que NO invalida caché hasta el final
export function useUpdateConstructionTaskDrag() {
  return useMutation({
    mutationFn: async (data: {
      id: string;
      start_date?: string;
      end_date?: string;
      duration_in_days?: number;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.start_date !== undefined) updateData.start_date = data.start_date;
      if (data.end_date !== undefined) updateData.end_date = data.end_date;
      if (data.duration_in_days !== undefined) updateData.duration_in_days = data.duration_in_days;

      const { data: result, error } = await supabase
        .from('construction_tasks')
        .update(updateData)
        .eq('id', data.id)
        .select('id, project_id, organization_id')
        .single();

      if (error) {
        console.error('Error updating construction task:', error);
        throw error;
      }

      return result;
    },
    // NO onSuccess para evitar invalidación inmediata de caché
    onError: (error) => {
      console.error('Error updating construction task drag:', error);
    },
  });
}

export function useDeleteConstructionTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      project_id: string;
      organization_id: string;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('construction_tasks')
        .delete()
        .eq('id', data.id);

      if (error) {
        console.error('Error deleting construction task:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks', data.project_id, data.organization_id] 
      });
      // Invalidar cache de materiales para que se actualice automáticamente
      queryClient.invalidateQueries({ 
        queryKey: ['construction-materials', data.project_id] 
      });
      toast({
        title: "Tarea eliminada",
        description: "La tarea se eliminó correctamente del proyecto",
      });
    },
    onError: (error) => {
      console.error('Error deleting construction task:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    },
  });
}