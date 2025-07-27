import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface GeneratedTask {
  id: string;
  code: string;
  template_id: string;
  param_values: Record<string, any>;
  is_public: boolean;
  is_system: boolean;
  created_at: string;
  organization_id: string;
  updated_at: string;
  scope: string;
  // Related data for dynamic name generation
  task_templates?: {
    id: string;
    name_template: string;
    task_group_id: string;
    unit_id?: string | null;
  };
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
      template_id: string;
      param_values: Record<string, any>;
      organization_id: string;
      is_system?: boolean;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // First, get the task_group_id from the template
      const { data: templateData, error: templateError } = await supabase
        .from('task_templates')
        .select('task_group_id')
        .eq('id', payload.template_id)
        .single();
      
      if (templateError || !templateData?.task_group_id) {
        throw new Error('Template not found or missing task_group_id');
      }
      
      // Call RPC function that handles both code generation and task creation/verification
      const { data: taskData, error: taskError } = await supabase
        .rpc('task_generate_code', {
          input_task_group_id: templateData.task_group_id,
          input_param_values: payload.param_values,
          input_organization_id: payload.organization_id,
          input_is_system: payload.is_system || false
        });
      
      if (taskError) throw taskError;
      if (!taskData || taskData.length === 0) throw new Error('No se pudo crear la tarea');
      
      // The function returns the task data directly
      const taskResult = taskData[0];
      
      // Now fetch the complete task data with template information
      const { data: completeTask, error: fetchError } = await supabase
        .from('task_generated')
        .select(`
          *,
          task_templates (
            id,
            name_template,
            task_group_id,
            unit_id
          )
        `)
        .eq('id', taskResult.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching complete task data:', fetchError);
        // Fallback to basic task data
        return { 
          new_task: taskResult, 
          generated_code: taskResult.code,
          is_existing: false
        };
      }
      
      return { 
        new_task: completeTask, 
        generated_code: taskResult.code,
        is_existing: false // Function handles duplicates internally
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-generated'] });
      
      toast({
        title: "Tarea Generada",
        description: `Tarea creada exitosamente con código ${data.generated_code}`,
        variant: "default"
      });
      return data.new_task;
    },
    onError: (error: any) => {
      console.error('Error handling task:', error);
      
      // Handle duplicate task error specifically
      if (error.code === '23505' && error.message?.includes('unique_generated_task_per_template_and_params')) {
        toast({
          title: "Tarea Duplicada",
          description: "Ya existe una tarea con estos parámetros exactos. Revisa la lista de tareas existentes.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Ocurrió un error al crear la tarea",
          variant: "destructive"
        });
      }
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
        .from('task_generated')
        .update({
          param_values: payload.input_param_values
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
      queryClient.invalidateQueries({ queryKey: ['task-generated'] });
      queryClient.invalidateQueries({ queryKey: ['task-search'] });
      queryClient.invalidateQueries({ queryKey: ['budget-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-generated-view'] });
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
