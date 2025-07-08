import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface GeneratedTask {
  id: string;
  code: string;
  template_id: string;
  param_values: Record<string, any>;
  is_public: boolean;
  created_at: string;
  organization_id: string;
  updated_at: string;
  scope: string;
  // Related data for dynamic name generation
  task_templates?: {
    id: string;
    name_template: string;
    code: string;
    category_id: string;
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
    queryKey: ['task-generated'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('task_generated')
        .select(`
          *,
          task_templates (
            id,
            name_template,
            code,
            category_id
          )
        `)
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
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Step 1: Generate task code using RPC function
      const { data: codeData, error: codeError } = await supabase
        .rpc('archub_generate_task_code', {
          template_id: payload.template_id
        });
      
      if (codeError) throw codeError;
      if (!codeData) throw new Error('No se pudo generar el código de la tarea');
      
      const generatedCode = codeData;
      
      // Step 2: Insert task with generated code
      const { data, error } = await supabase
        .from('task_generated')
        .insert({
          code: generatedCode,
          template_id: payload.template_id,
          param_values: payload.param_values,
          is_public: false,
          organization_id: payload.organization_id
        })
        .select()
        .single();
      
      if (error) throw error;
      return { new_task: data, generated_code: generatedCode };
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
      toast({
        title: "Error",
        description: error.message || "Error al crear la tarea generada",
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
        .from('task_generated')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-generated'] });
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

// Hook para actualizar tarea generada
export function useUpdateGeneratedTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      task_id: string;
      input_param_values: Record<string, any>;
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
