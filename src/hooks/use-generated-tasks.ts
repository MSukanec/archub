import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface GeneratedTask {
  id: string;
  code: string;
  param_values: any; // JSONB from database
  param_order?: string[]; // Array of parameter slugs in order
  name_rendered: string;
  unit_id?: string;
  unit_name?: string;
  category_id?: string;
  category_name?: string;
  organization_id?: string;
  is_system: boolean;
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
    queryKey: ['task-parametric-view'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('task_parametric_view')
        .select(`*`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GeneratedTask[];
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
          throw error;
        }
        
        
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
        
        // Fallback: use direct table insertion if RPC fails
        // Verificar si ya existe una tarea con esos parámetros exactos
        const paramValuesString = JSON.stringify(payload.param_values);
        const { data: existingTask, error: searchError } = await supabase
          .from('task_parametric')
          .select('*')
          .eq('param_values', paramValuesString)
          .single();
        
        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = no rows found
          throw searchError;
        }
        
        let taskResult;
        
        if (existingTask) {
          // Task already exists, return it
          taskResult = existingTask;
        } else {
          // Get the last code number
          const { data: lastTask, error: lastCodeError } = await supabase
            .from('task_parametric')
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
            .from('task_parametric')
            .insert({
              code: newCode,
              param_values: payload.param_values,
              param_order: payload.param_order || []
            })
            .select()
            .single();
          
          if (createError) {
            throw createError;
          }
          
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
      queryClient.invalidateQueries({ queryKey: ['task-parametric'] });
      queryClient.invalidateQueries({ queryKey: ['task-parametric-view'] });
      queryClient.invalidateQueries({ queryKey: ['task-parametric-library'] });
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
      return data.new_task;
    },
    onError: (error: any) => {
      
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
        .from('task_parametric')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ['task-parametric'] });
      queryClient.invalidateQueries({ queryKey: ['task-parametric-view'] });
      queryClient.invalidateQueries({ queryKey: ['task-parametric-library'] });
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

// Hook para obtener materiales de una tarea generada
export function useTaskMaterials(taskId: string | null) {
  return useQuery({
    queryKey: ['task-materials', taskId],
    queryFn: async () => {
      if (!supabase || !taskId) return [];
      
      const { data, error } = await supabase
        .from('task_materials')
        .select(`
          *,
          materials (
            id,
            name,
            units(name)
          )
        `)
        .eq('task_id', taskId);
      
      if (error) {
        throw error;
      }
      
      return data as TaskMaterial[];
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
      
      
      const { data: result, error } = await supabase
        .from('task_materials')
        .insert([data])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
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
      
      
      const updateData: any = {
        param_values: payload.input_param_values
      };
      
      // Solo incluir param_order si se proporciona
      if (payload.param_order !== undefined) {
        updateData.param_order = payload.param_order;
      }
      
      const { data, error } = await supabase
        .from('task_parametric')
        .update(updateData)
        .eq('id', payload.task_id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ['task-parametric'] });
      queryClient.invalidateQueries({ queryKey: ['task-parametric-view'] });
      queryClient.invalidateQueries({ queryKey: ['task-parametric-library'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      
      toast({
        title: "Tarea Actualizada",
        description: "La tarea se ha actualizado exitosamente"
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


