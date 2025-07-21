import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface ConstructionTask {
  // Identificadores principales de la vista
  task_instance_id: string;  // ID principal de la instancia de tarea
  project_id: string;
  task_id: string;          // ID de la tarea generada original
  
  // Datos de la tarea
  task_code: string;
  param_values: any;
  
  // Fechas y duración
  start_date?: string;
  end_date?: string;
  duration_in_days?: number;
  
  // Información de fase
  phase_instance_id: string;
  phase_name: string;
  phase_position: number;
  
  // Progreso
  progress_percent: number;

  // Para compatibilidad con el sistema existente - mapearemos los campos
  id: string; // Será task_instance_id
  organization_id?: string; // Lo obtendremos del contexto
  quantity?: number; // Lo obtendremos si es necesario
  created_by?: string; // Lo obtendremos si es necesario
  created_at?: string; // Lo obtendremos si es necesario
  updated_at?: string; // Lo obtendremos si es necesario
  
  // Información de tarea para compatibilidad
  task?: {
    id: string;
    code: string;
    display_name: string;
    rubro_name: string | null;
    category_name: string | null;
    unit_id: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
    rubro_id: string | null;
    param_values: any;
  };
}

export function useConstructionTasks(projectId: string, organizationId: string) {
  return useQuery({
    queryKey: ['construction-tasks', projectId, organizationId],
    queryFn: async (): Promise<ConstructionTask[]> => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Usar construction_gantt_view simplificada - ya incluye todos los campos necesarios
      const { data: ganttData, error } = await supabase
        .from('construction_gantt_view')
        .select(`
          *,
          task_rubro:task_generated_view!task_id (
            rubro_id,
            rubro:rubros!rubro_id (
              id,
              name
            )
          )
        `)
        .eq('project_id', projectId)
        .order('phase_position', { ascending: true });

      if (error) {
        console.error('Error fetching construction gantt view:', error);
        throw error;
      }

      if (!ganttData || ganttData.length === 0) {
        return [];
      }

      // Debug: ver qué campos están llegando exactamente
      console.log('RAW GANTT DATA SAMPLE:', JSON.stringify(ganttData?.[0], null, 2));

      // Mapear datos de construction_gantt_view al formato esperado
      const mappedTasks: ConstructionTask[] = ganttData.map((item: any) => {
        return {
          // Campos principales de la vista
          task_instance_id: item.task_instance_id,
          project_id: item.project_id,
          task_id: item.task_id,
          task_code: item.task_code,
          param_values: item.param_values,
          start_date: item.start_date,
          end_date: item.end_date,
          duration_in_days: item.duration_in_days,
          quantity: item.quantity || 0, // CANTIDAD DIRECTA DE LA VISTA
          
          // Campos de fase de la vista
          phase_instance_id: item.phase_instance_id,
          phase_name: item.phase_name,
          phase_position: item.phase_position,
          progress_percent: item.progress_percent || 0,
          
          // Compatibilidad con sistema existente
          id: item.task_instance_id, // ID principal para compatibilidad
          organization_id: organizationId, // Del contexto
          
          // Crear objeto task para compatibilidad con componentes existentes
          task: {
            id: item.task_id,
            code: item.task_code,
            display_name: item.display_name || item.task_code, // DISPLAY_NAME DIRECTO DE LA VISTA
            rubro_name: item.task_rubro?.rubro?.name || null, // DATOS DE RUBRO VIA JOIN
            category_name: null,
            unit_id: item.unit_id,
            unit_name: item.unit_name || null, // UNIT_NAME DIRECTO DE LA VISTA
            unit_symbol: item.unit_symbol || null, // UNIT_SYMBOL DIRECTO DE LA VISTA
            rubro_id: item.task_rubro?.rubro_id || null,
            param_values: item.param_values
          }
        };
      });

      console.log('UPDATED GANTT VIEW DATA:', {
        projectId,
        totalTasks: mappedTasks.length,
        phases: mappedTasks.map(t => t.phase_name).filter((v, i, a) => a.indexOf(v) === i),
        sample: {
          display_name: mappedTasks[0]?.task?.display_name,
          rubro_name: mappedTasks[0]?.task?.rubro_name,
          unit_name: mappedTasks[0]?.task?.unit_name,
          unit_symbol: mappedTasks[0]?.task?.unit_symbol,
          quantity: mappedTasks[0]?.quantity,
          view_fields: {
            display_name: ganttData?.[0]?.display_name,
            unit_name: ganttData?.[0]?.unit_name,
            unit_symbol: ganttData?.[0]?.unit_symbol,
            quantity: ganttData?.[0]?.quantity,
            rubro_join: ganttData?.[0]?.task_rubro?.rubro?.name
          }
        }
      });

      return mappedTasks;
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
      id: string; // task_instance_id
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

      // CAMBIO: Usar task_instance_id para actualizar construction_tasks
      const { data: result, error } = await supabase
        .from('construction_tasks')
        .update(updateData)
        .eq('id', data.id) // data.id es task_instance_id ahora
        .select('id, project_id, organization_id')
        .single();

      if (error) {
        console.error('Error updating construction task resize:', error);
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
      console.error('Error updating construction task resize:', error);
      // Sin toast para redimensionamiento - feedback visual suficiente
    },
  });
}

// Hook específico para drag que NO invalida caché hasta el final
export function useUpdateConstructionTaskDrag() {
  return useMutation({
    mutationFn: async (data: {
      id: string; // task_instance_id
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

      // CAMBIO: Usar task_instance_id para updates de drag
      const { data: result, error } = await supabase
        .from('construction_tasks')
        .update(updateData)
        .eq('id', data.id) // data.id es task_instance_id ahora
        .select('id, project_id, organization_id')
        .single();

      if (error) {
        console.error('Error updating construction task drag:', error);
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