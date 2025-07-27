import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface GeneratedTask {
  id: string;
  code: string;
  param_values: string; // JSON string from database
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
    queryKey: ['task-parametric'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('task_parametric')
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
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('🚀 Creating task with parameters:', payload.param_values);
      
      // Call the new centralized SQL function
      const { data: taskData, error: taskError } = await supabase
        .rpc('archub_generate_task_parametric', {
          input_param_values: payload.param_values
        });
      
      if (taskError) {
        console.error('❌ Error calling archub_generate_task_parametric:', taskError);
        throw taskError;
      }
      
      if (!taskData || taskData.length === 0) {
        throw new Error('No se pudo crear la tarea');
      }
      
      const taskResult = taskData[0];
      console.log('✅ Task created/found:', taskResult);
      
      return { 
        new_task: taskResult, 
        generated_code: taskResult.code,
        is_existing: false // The function handles deduplication internally
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-parametric'] });
      
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
        .from('task_parametric')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parametric'] });
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
        console.error('Error fetching task materials:', error);
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
      input_is_system?: boolean;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('Updating generated task with data:', payload);
      
      const { data, error } = await supabase
        .from('task_parametric')
        .update({
          param_values: JSON.stringify(payload.input_param_values)
        })
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
      queryClient.invalidateQueries({ queryKey: ['task-parametric'] });
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
