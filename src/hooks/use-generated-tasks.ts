import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface GeneratedTask {
  id: string;
  code: string;
  param_values: any; // JSONB from database
  param_order?: string[]; // Array of parameter slugs in order
  name_rendered: string;
  custom_name?: string;
  organization_id?: string;
  is_system: boolean;
  is_completed?: boolean;
  unit: string;
  category: string;
  division?: string; // División/rubro de la tarea
  created_at: string;
  updated_at: string;
}

// Interface for task materials
export interface TaskMaterial {
  id: string
  task_id: string
  material_id: string
  amount: number
  organization_id: string
  created_at: string
  materials?: {
    id: string
    name: string
    units: {
      name: string
    }
  }
}

export function useGeneratedTasks() {
  return useQuery({
    queryKey: ['tasks-view'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('tasks_view')
        .select(`*`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GeneratedTask[];
    }
  });
}

export function useGeneratedTask(taskId: string) {
  return useQuery({
    queryKey: ['tasks-view', taskId],
    queryFn: async () => {
      if (!supabase || !taskId) throw new Error('Supabase not initialized or no task ID');
      
      const { data, error } = await supabase
        .from('tasks_view')
        .select(`*`)
        .eq('id', taskId)
        .single();
      
      if (error) throw error;
      return data as GeneratedTask;
    },
    enabled: !!taskId
  });
}

// Hook para obtener el conteo de uso de tareas en construction_tasks
export function useTaskUsageCount() {
  return useQuery({
    queryKey: ['task-usage-count'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('construction_tasks')
        .select('task_id')
        .not('task_id', 'is', null);
      
      if (error) throw error;
      
      // Contar cuántas veces aparece cada task_id
      const usageCount: Record<string, number> = {};
      data.forEach(item => {
        if (item.task_id) {
          usageCount[item.task_id] = (usageCount[item.task_id] || 0) + 1;
        }
      });
      
      return usageCount;
    }
  });
}

export function useCreateGeneratedTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      param_values: Record<string, any>;
      param_order?: string[];
      unit_id?: string;
      category_id?: string;
      organization_id?: string;
      custom_name?: string;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('🚀 Creating task with parameters:', payload.param_values);
      console.log('🎯 Parameter order:', payload.param_order);
      console.log('🔧 Additional fields:', {
        unit_id: payload.unit_id,
        category_id: payload.category_id,
        organization_id: payload.organization_id,
        custom_name: payload.custom_name
      });
      
      try {
        // Use the RPC function with ALL parameters
        const { data, error } = await supabase.rpc('create_parametric_task', {
          input_param_values: payload.param_values,  // JSONB
          input_param_order: payload.param_order || [], // text[]
          input_unit_id: payload.unit_id || null, // UUID
          input_category_id: payload.category_id || null, // UUID
          input_organization_id: payload.organization_id || null, // UUID
          input_custom_name: payload.custom_name || null // text
        });
        
        if (error) {
          console.error('❌ Error calling create_parametric_task RPC:', error);
          throw error;
        }
        
        console.log('✅ RPC function returned:', data);
        
        if (!data || data.length === 0) {
          throw new Error('No data returned from create_parametric_task function');
        }
        
        const taskResult = data[0]; // Function returns array of rows
        
        return { 
          new_task: taskResult, 
          generated_code: taskResult.code,
          is_existing: false
        };
      } catch (rpcError) {
        console.error('❌ RPC function failed, falling back to direct insertion:', rpcError);
        
        // Fallback: use direct table insertion if RPC fails
        // Verificar si ya existe una tarea con esos parámetros exactos
        const paramValuesString = JSON.stringify(payload.param_values);
        const { data: existingTask, error: searchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('param_values', paramValuesString)
          .single();
        
        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('❌ Error searching for existing task:', searchError);
          throw searchError;
        }
        
        let taskResult;
        
        if (existingTask) {
          // Task already exists, return it
          console.log('✅ Found existing task:', existingTask);
          taskResult = existingTask;
        } else {
          // Get the last code number
          const { data: lastTask, error: lastCodeError } = await supabase
            .from('tasks')
            .select('code')
            .order('code', { ascending: false })
            .limit(1)
            .single();
          
          let newCodeNumber = 1;
          if (lastTask && lastTask.code && /^\d+$/.test(lastTask.code)) {
            newCodeNumber = parseInt(lastTask.code) + 1;
          }
          
          const newCode = newCodeNumber.toString().padStart(6, '0');
          
          // Create new task
          const { data: newTask, error: createError } = await supabase
            .from('tasks')
            .insert({
              code: newCode,
              param_values: payload.param_values,
              param_order: payload.param_order || []
            })
            .select()
            .single();
          
          if (createError) {
            console.error('❌ Error creating new task:', createError);
            throw createError;
          }
          
          console.log('✅ Created new task via fallback:', newTask);
          taskResult = newTask;
        }
        
        return { 
          new_task: taskResult, 
          generated_code: taskResult.code,
          is_existing: false
        };
      }
    },
    onSuccess: (data) => {
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-view'] });
      queryClient.invalidateQueries({ queryKey: ['task-library'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      
      toast({
        title: "Tarea Generada",
        description: `Tarea creada exitosamente con código ${data.generated_code}`,
        variant: "default"
      });
      console.log('🎉 Task creation successful:', data.new_task);
      return data.new_task;
    },
    onError: (error: any) => {
      console.error('❌ Error creating task:', error);
      
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al crear la tarea",
        variant: "destructive"
      });
    }
  });
}

export function useDeleteGeneratedTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-view'] });
      queryClient.invalidateQueries({ queryKey: ['task-library'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      
      toast({
        title: "Tarea Eliminada",
        description: "La tarea generada se ha eliminado exitosamente",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la tarea generada",
        variant: "destructive"
      });
    }
  });
}

// Hook para obtener materiales de una tarea generada con precios de material_view
export function useTaskMaterials(taskId: string | null) {
  return useQuery({
    queryKey: ['task-materials', taskId],
    queryFn: async () => {
      if (!supabase || !taskId) return [];
      
      const { data, error } = await supabase
        .from('task_materials')
        .select(`
          id,
          task_id,
          material_id,
          amount,
          materials_view (
            id,
            name,
            unit_of_computation,
            avg_price,
            category_name
          )
        `)
        .eq('task_id', taskId);
      
      if (error) {
        console.error('Error fetching task materials:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!taskId && !!supabase
  });
}

// Hook para crear material de tarea
export function useCreateTaskMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: { task_id: string; material_id: string; amount: number; organization_id: string }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('Attempting to create task material with data:', data);
      
      const { data: result, error } = await supabase
        .from('task_materials')
        .insert([data])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating task material:', error);
        throw error;
      }
      
      console.log('Task material created successfully:', result);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-materials', variables.task_id] });
      queryClient.invalidateQueries({ queryKey: ['materials', variables.organization_id] });
      toast({
        title: "Material Agregado",
        description: "El material se ha agregado a la tarea exitosamente"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al agregar el material",
        variant: "destructive"
      });
    }
  });
}

// Hook para eliminar material de tarea
export function useDeleteTaskMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('task_materials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['task-costs'] });
      toast({
        title: "Material Eliminado",
        description: "El material se ha eliminado de la tarea"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el material",
        variant: "destructive"
      });
    }
  });
}

// Hook para actualizar material de tarea
export function useUpdateTaskMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: { id: string; amount: number }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data: result, error } = await supabase
        .from('task_materials')
        .update({ amount: data.amount })
        .eq('id', data.id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({
        title: "Material Actualizado",
        description: "La cantidad del material se ha actualizado exitosamente"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el material",
        variant: "destructive"
      });
    }
  });
}

// Hook para actualizar tarea generada
export function useUpdateGeneratedTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      task_id: string;
      input_param_values: Record<string, any>;
      param_order?: string[];
      input_is_system?: boolean;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('Updating generated task with data:', payload);
      console.log('🎯 Updating param_order:', payload.param_order);
      
      const updateData: any = {
        param_values: payload.input_param_values
      };
      
      // Solo incluir param_order si se proporciona
      if (payload.param_order !== undefined) {
        updateData.param_order = payload.param_order;
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', payload.task_id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }
      
      console.log('Task updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-view'] });
      queryClient.invalidateQueries({ queryKey: ['task-library'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      
      toast({
        title: "Tarea Actualizada",
        description: "La tarea se ha actualizada exitosamente"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la tarea",
        variant: "destructive"
      });
    }
  });
}

// Hook para crear labor de tarea
export function useCreateTaskLabor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      task_id: string;
      labor_type_id: string;
      quantity: number;
      organization_id: string;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('task_labor')
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries específicas usando taskId
      queryClient.invalidateQueries({ queryKey: ['task-labor', variables.task_id] });
      queryClient.invalidateQueries({ queryKey: ['task-costs', variables.task_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks-view'] });
      
      toast({
        title: "Mano de Obra Agregada",
        description: "La mano de obra se ha agregado exitosamente a la tarea",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al agregar mano de obra a la tarea",
        variant: "destructive"
      });
    }
  });
}

// Hook para eliminar labor de tarea
export function useDeleteTaskLabor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (laborId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('task_labor')
        .delete()
        .eq('id', laborId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con labor
      queryClient.invalidateQueries({ queryKey: ['task-labor'] });
      queryClient.invalidateQueries({ queryKey: ['task-costs'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-view'] });
      
      toast({
        title: "Mano de Obra Eliminada",
        description: "La mano de obra se ha eliminado exitosamente de la tarea",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar mano de obra de la tarea",
        variant: "destructive"
      });
    }
  });
}


