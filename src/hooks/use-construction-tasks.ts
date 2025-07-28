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
      
      console.log('🔍 FETCHING CONSTRUCTION TASKS:', {
        projectId,
        organizationId,
        enabled: !!projectId && !!organizationId
      });
      
      // Ya que construction_tasks está vacía, usar task_parametric directamente
      // que contiene las nuevas tareas generadas del sistema
      const { data: parametricTasks, error } = await supabase
        .from('task_parametric')
        .select('*')
        .order('created_at', { ascending: true });
        
      console.log('📊 PARAMETRIC TASKS QUERY RESULT:', {
        totalTasks: parametricTasks?.length || 0,
        error: error?.message,
        firstRecord: parametricTasks?.[0]
      });

      if (error) {
        console.error('Error fetching parametric tasks:', error);
        throw error;
      }

      if (!parametricTasks || parametricTasks.length === 0) {
        console.log('No parametric tasks found');
        return [];
      }

      // Debug: ver qué campos están llegando exactamente
      console.log('RAW PARAMETRIC TASKS SAMPLE:', JSON.stringify(parametricTasks?.[0], null, 2));

      // Generar nombres descriptivos basados en los parámetros
      const tasksWithNames = await Promise.all(parametricTasks.map(async (task: any) => {
        try {
          // Intentar generar un nombre más descriptivo
          let displayName = task.name_rendered;
          
          if (!displayName && task.param_values) {
            // Si param_values es string, parsearlo
            const paramValues = typeof task.param_values === 'string' 
              ? JSON.parse(task.param_values) 
              : task.param_values;
            
            if (Object.keys(paramValues).length > 0) {
              // Obtener las opciones de parámetros para crear un nombre descriptivo
              const { data: paramOptions } = await supabase
                .from('task_parameter_options')
                .select('id, label')
                .in('id', Object.values(paramValues));
              
              if (paramOptions && paramOptions.length > 0) {
                // Crear nombre concatenando las opciones
                const optionLabels = paramOptions.map(opt => opt.label).join(' ');
                displayName = `Ejecución de ${optionLabels.toLowerCase()}`;
              }
            }
          }
          
          // Fallback al código de tarea
          if (!displayName) {
            displayName = `Tarea paramétrica ${task.code || 'sin código'}`;
          }
          
          return { ...task, display_name: displayName };
        } catch (error) {
          console.error('Error generating task name:', error);
          return { ...task, display_name: `Tarea paramétrica ${task.code || 'sin código'}` };
        }
      }));

      // Mapear datos de task_parametric al formato esperado para construcción
      const mappedTasks: ConstructionTask[] = tasksWithNames.map((item: any, index: number) => {
        return {
          // Campos principales usando task_parametric
          task_instance_id: item.id,
          project_id: projectId, // Asignar projectId actual
          task_id: item.id, // Usar mismo ID de task_parametric
          task_code: item.code || `000${index + 1}`.slice(-3), // Usar código generado o crear uno
          param_values: typeof item.param_values === 'string' ? JSON.parse(item.param_values) : (item.param_values || {}),
          start_date: null, // Por defecto null
          end_date: null,
          duration_in_days: null,
          quantity: 1, // Cantidad por defecto
          
          // Campos de fase (simulados por ahora)
          phase_instance_id: '',
          phase_name: 'Sin fase',
          phase_position: 0,
          progress_percent: 0,
          
          // Compatibilidad con sistema existente
          id: item.id,
          organization_id: organizationId,
          created_at: item.created_at,
          updated_at: item.updated_at,
          
          // Crear objeto task para compatibilidad con componentes existentes
          task: {
            id: item.id,
            code: item.code || `000${index + 1}`.slice(-3),
            display_name: item.display_name || `Tarea paramétrica ${item.code || index + 1}`,
            rubro_name: null,
            category_name: null,
            unit_id: null,
            unit_name: 'm²', // Unidad por defecto
            unit_symbol: 'm²',
            rubro_id: null,
            param_values: typeof item.param_values === 'string' ? JSON.parse(item.param_values) : (item.param_values || {})
          }
        };
      });

      console.log('CONSTRUCTION TASKS MAPPED DATA:', {
        projectId,
        totalTasks: mappedTasks.length,
        phases: mappedTasks.map(t => t.phase_name).filter((v, i, a) => a.indexOf(v) === i),
        sample: {
          display_name: mappedTasks[0]?.task?.display_name,
          task_code: mappedTasks[0]?.task_code,
          quantity: mappedTasks[0]?.quantity,
          progress: mappedTasks[0]?.progress_percent
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
            project_id: taskData.project_id, // Incluir project_id en la vinculación
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
              project_id: data.project_id, // Incluir project_id en la vinculación
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
    onSuccess: (data, variables) => {
      // Para resize: usar setQueryData para actualización silenciosa sin refetch
      queryClient.setQueryData(
        ['construction-tasks', data.project_id, data.organization_id], 
        (oldData: any) => {
          if (!oldData) return oldData;
          
          // Actualizar solo la tarea específica en el cache
          return oldData.map((task: any) => 
            task.id === variables.id 
              ? { 
                  ...task, 
                  start_date: variables.start_date || task.start_date,
                  end_date: variables.end_date || task.end_date,
                  duration_in_days: variables.duration_in_days || task.duration_in_days,
                  updated_at: new Date().toISOString()
                }
              : task
          );
        }
      );
      
      // Solo invalidar dependencias si es necesario para las flechas
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