import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// Interfaz actualizada para la vista CONSTRUCTION_TASKS_VIEW
export interface ConstructionTaskView {
  id: string;
  organization_id: string; // Nueva columna agregada
  project_id: string;
  task_id: string;
  custom_name: string;
  category_name: string;
  division_name: string; // Campo agregado desde la vista SQL
  unit: string; // Nueva columna agregada desde la vista
  cost_scope: string; // Enum: materials_only | labor_only | materials_and_labor
  cost_scope_label: string; // Label human-readable: MAT | M.O. | M.O. + MAT.
  quantity: number; // real en DB, number en TS
  start_date: string | null; // date en DB, string en TS
  end_date: string | null; // date en DB, string en TS
  duration_in_days: number | null; // integer en DB, number en TS
  progress_percent: number; // integer en DB, number en TS
  description: string | null; // Nueva columna description
  markup_pct: number | null; // Nueva columna para margen de beneficio
  phase_name: string | null;
  created_at: string; // timestamp with time zone en DB, string en TS
  updated_at: string; // timestamp with time zone en DB, string en TS
}

// Hook específico para la vista CONSTRUCTION_TASKS_VIEW optimizada para cronograma
export function useConstructionTasksView(projectId: string, organizationId: string) {
  return useQuery({
    queryKey: ['construction-tasks-view', projectId, organizationId],
    queryFn: async (): Promise<ConstructionTaskView[]> => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('construction_tasks_view')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching construction tasks view:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!projectId && !!organizationId,
  });
}

export interface ConstructionTask {
  // Identificadores principales de la vista
  task_instance_id: string;  // ID principal de la instancia de tarea
  project_id: string;
  task_id: string;          // ID de la tarea generada original
  
  // Datos de la tarea
  task_code: string;
  param_values: any;
  display_name?: string;    // Nombre renderizado de la tarea
  rubro_name?: string;      // Nombre del rubro/división
  unit_symbol?: string;     // Símbolo de la unidad
  
  // Fechas y duración
  start_date?: string;
  end_date?: string;
  duration_in_days?: number;
  
  // Información de fase
  phase_instance_id: string;
  phase_name: string;
  
  // Progreso
  progress_percent: number;

  // Descripción
  description?: string | null;

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
      
      console.log('Fetching construction tasks for project:', projectId, 'in organization:', organizationId);
      
      // Validar que tenemos los parámetros necesarios
      if (!projectId || !organizationId) {
        console.log('Missing projectId or organizationId, returning empty array');
        return [];
      }
      
      // Obtener las tareas de construcción desde la vista que incluye division_name
      const { data: constructionTasks, error: constructionError } = await supabase
        .from('construction_tasks_view')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (constructionError) {
        console.error('Error fetching construction tasks:', constructionError);
        throw constructionError;
      }
      
      if (!constructionTasks || constructionTasks.length === 0) {
        console.log('No construction tasks found for project:', projectId);
        return [];
      }

      // Debug logs removed

      // Obtener los IDs de las tareas
      const taskIds = constructionTasks.map(ct => ct.task_id);
      const constructionTaskIds = constructionTasks.map(ct => ct.id);
      
      // Consultar los detalles de las tareas en task_view
      const { data: taskDetails, error } = await supabase
        .from('task_view')
        .select('*')
        .in('id', taskIds);

      // Obtener las relaciones de fases para las tareas de construcción
      const { data: phaseRelations, error: phaseError } = await supabase
        .from('construction_phase_tasks')
        .select(`
          construction_task_id,
          project_phase_id,
          progress_percent,
          construction_project_phases (
            id,
            position,
            construction_phases (
              id,
              name
            )
          )
        `)
        .in('construction_task_id', constructionTaskIds);

      if (phaseError) {
        console.error('Error fetching phase relations:', phaseError);
      }

      // Debug logs removed

      if (error) {
        console.error('Error fetching construction tasks:', error);
        throw error;
      }

      if (!constructionTasks || constructionTasks.length === 0) {
        console.log('No construction tasks found for project:', projectId);
        return [];
      }

      // Debug logs removed

      // Crear un mapa de los detalles de tareas por ID para fácil acceso
      const taskDetailsMap = new Map();
      if (taskDetails) {
        taskDetails.forEach(task => {
          taskDetailsMap.set(task.id, task);
        });
      }

      // Crear un mapa de las relaciones de fases por construction_task_id
      const phaseRelationsMap = new Map();
      if (phaseRelations) {
        phaseRelations.forEach(relation => {
          phaseRelationsMap.set(relation.construction_task_id, relation);
        });
      }

      // Mapear datos de construction_tasks al formato esperado
      const mappedTasks: ConstructionTask[] = constructionTasks.map((item: any) => {
        const taskData = taskDetailsMap.get(item.task_id);
        const phaseRelation = phaseRelationsMap.get(item.id);
        
        
        
        // Extraer información de fase si existe
        const projectPhase = phaseRelation?.construction_project_phases;
        const phase = projectPhase?.construction_phases;
        
        // Debug logs removed
        
        return {
          // Campos principales de construction_tasks
          task_instance_id: item.id, // ID de construction_tasks
          project_id: item.project_id,
          task_id: item.task_id, // FK a tasks
          task_code: taskData?.code || '',
          param_values: taskData?.param_values || {},
          start_date: item.start_date,
          end_date: item.end_date,
          duration_in_days: item.duration_in_days,
          quantity: item.quantity,
          
          // Campos de fase - obtenidos de la relación
          phase_instance_id: projectPhase?.id || '', 
          phase_name: phase?.name || 'Sin fase',

          progress_percent: phaseRelation?.progress_percent || 0,
          
          // Descripción
          description: item.description || null,
          
          // Campos de división - obtenidos directamente de construction_tasks_view
          division_name: item.division_name || null,
          category_name: item.category_name || null,
          
          // Compatibilidad con sistema existente
          id: item.id, // ID de construction_tasks para compatibilidad
          organization_id: item.organization_id,
          created_by: item.created_by,
          created_at: item.created_at,
          updated_at: item.updated_at,
          
          // Crear objeto task para compatibilidad con componentes existentes
          task: {
            id: taskData?.id || item.task_id,
            code: taskData?.code || '',
            display_name: taskData?.name_rendered || taskData?.code || 'Sin nombre',
            rubro_name: taskData?.category_name || null,
            category_name: taskData?.category_name || null,
            division_name: item.division_name || null,
            unit_id: taskData?.unit_id,
            unit_name: taskData?.unit_name || null,
            unit_symbol: taskData?.unit_name || null,
            rubro_id: taskData?.category_id || null,
            param_values: taskData?.param_values || {}
          }
        };
      });

      // Debug logs removed

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
      project_phase_id?: string; // ID de la fase del proyecto (construction_project_phases.id) para crear en construction_phase_tasks
      progress_percent?: number;
      description?: string;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      console.log('🔧 HOOK useCreateConstructionTask - DATOS RECIBIDOS:', taskData);

      // Preparar datos para inserción (solo campos que existen en construction_tasks)
      const insertData = {
        organization_id: taskData.organization_id,
        project_id: taskData.project_id,
        task_id: taskData.task_id,
        quantity: taskData.quantity,
        created_by: taskData.created_by,
        start_date: taskData.start_date || null,
        end_date: taskData.end_date || null,
        duration_in_days: taskData.duration_in_days || null,
        description: taskData.description || null
      };

      console.log('📝 DATOS PREPARADOS PARA INSERT (construction_tasks):', insertData);

      // Crear la tarea de construcción
      const { data: constructionTask, error: taskError } = await supabase
        .from('construction_tasks')
        .insert(insertData)
        .select('*')
        .single();

      if (taskError) {
        console.error('❌ ERROR CREANDO CONSTRUCCION TASK:', taskError);
        console.error('❌ Datos que causaron el error:', taskData);
        console.error('❌ Error completo:', JSON.stringify(taskError, null, 2));
        throw taskError;
      }

      console.log('✅ TAREA DE CONSTRUCCION CREADA EXITOSAMENTE:', constructionTask);

      // Si se especifica una fase, crear la relación en construction_phase_tasks
      if (taskData.project_phase_id) {
        console.log('📋 CREANDO RELACION FASE-TAREA para phase_id:', taskData.project_phase_id);
        
        const { error: phaseTaskError } = await supabase
          .from('construction_phase_tasks')
          .insert({
            construction_task_id: constructionTask.id,
            project_phase_id: taskData.project_phase_id,
            project_id: taskData.project_id,
            progress_percent: 0
          });

        if (phaseTaskError) {
          console.error('❌ ERROR CREANDO RELACION FASE-TAREA:', phaseTaskError);
          // No lanzamos error porque la tarea principal ya se creó
        } else {
          console.log('✅ RELACION FASE-TAREA CREADA EXITOSAMENTE');
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
      // Invalidar cache de vista para modales de movimientos
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks-view', data.project_id] 
      });
      // Invalidar cache de materiales para que se actualice automáticamente
      queryClient.invalidateQueries({ 
        queryKey: ['construction-materials', data.project_id] 
      });
      toast({
        title: "Cómputo agregado",
        description: "El cómputo se agregó correctamente al proyecto",
      });
    },
    onError: (error) => {
      console.error('Error adding construction task:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el cómputo",
        variant: "destructive",
      });
    },
  });
}

// Función para inicializar cost_scope en registros existentes
export function useInitializeCostScope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      organization_id: string;
      project_id: string;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data: result, error } = await supabase
        .from('construction_tasks')
        .update({ cost_scope: 'materials_and_labor' })
        .eq('organization_id', data.organization_id)
        .eq('project_id', data.project_id)
        .is('cost_scope', null)
        .select();

      if (error) {
        console.error('Error initializing cost_scope:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (result, data) => {
      console.log(`Initialized cost_scope for ${result?.length || 0} tasks`);
      // Invalidar cache para refrescar los datos
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks-view']
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
      cost_scope?: string;
      project_id: string;
      organization_id: string;
      start_date?: string;
      end_date?: string;
      duration_in_days?: number;
      project_phase_id?: string;
      progress_percent?: number;
      task_id?: string;
      description?: string;
      markup_pct?: number;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.cost_scope !== undefined) updateData.cost_scope = data.cost_scope;
      if (data.start_date !== undefined) updateData.start_date = data.start_date;
      if (data.end_date !== undefined) updateData.end_date = data.end_date;
      if (data.duration_in_days !== undefined) updateData.duration_in_days = data.duration_in_days;
      if (data.task_id !== undefined) updateData.task_id = data.task_id;
      if (data.description !== undefined) updateData.description = data.description?.trim() ? data.description : null;
      if (data.markup_pct !== undefined) updateData.markup_pct = data.markup_pct;

      const { data: result, error } = await supabase
        .from('construction_tasks')
        .update(updateData)
        .eq('id', data.id)
        .select('*')
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
      // Invalidar cache de vista para modales de movimientos - MEJORADO para capturar cambios de cost_scope
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks-view'] 
      });
      // Invalidar cache de materiales para que se actualice automáticamente
      queryClient.invalidateQueries({ 
        queryKey: ['construction-materials', data.project_id] 
      });
      // También invalidar las queries de dependencias por si afectan al Gantt
      queryClient.invalidateQueries({ 
        queryKey: ['construction-dependencies'] 
      });
      
      // Solo mostrar toast para operaciones que no sean cost_scope
      const isOnlyCostScope = Object.keys(data).length <= 4 && 'cost_scope' in data;
      if (!isOnlyCostScope) {
        toast({
          title: "Cómputo actualizado",
          description: "Los cambios se guardaron correctamente",
        });
      }
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
      // ✅ INVALIDAR CACHE DE LA VISTA PARA CRONOGRAMA
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks-view', data.project_id] 
      });
      // Invalidar cache de materiales para que se actualice automáticamente
      queryClient.invalidateQueries({ 
        queryKey: ['construction-materials', data.project_id] 
      });
      // También invalidar dependencias para el cronograma
      queryClient.invalidateQueries({ 
        queryKey: ['construction-dependencies'] 
      });
      toast({
        title: "Cómputo eliminado",
        description: "El cómputo se eliminó correctamente del proyecto",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting construction task:', error);
      
      // Manejar diferentes tipos de errores con mensajes específicos
      let title = "Error";
      let description = "No se pudo eliminar la tarea";
      
      if (error?.code === '23503') {
        // Foreign key constraint violation
        if (error?.details?.includes('movement_tasks')) {
          title = "No se puede eliminar la tarea";
          description = "Esta tarea tiene movimientos financieros asociados. Elimina primero los movimientos para poder borrar la tarea.";
        } else if (error?.details?.includes('construction_dependencies')) {
          title = "No se puede eliminar la tarea";
          description = "Esta tarea tiene dependencias con otras tareas. Elimina primero las dependencias para poder borrar la tarea.";
        } else {
          title = "No se puede eliminar la tarea";
          description = "Esta tarea está siendo utilizada por otros elementos del sistema. Elimina primero las referencias para poder borrar la tarea.";
        }
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });
}