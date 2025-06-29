import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface GeneratedTask {
  id: string;
  code: string;
  template_id: string;
  param_values: Record<string, any>;
  description: string;
  created_by: string;
  is_public: boolean;
  created_at: string;
}

export function useGeneratedTasks() {
  return useQuery({
    queryKey: ['generated-tasks'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('generated_tasks')
        .select('*')
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
      input_template_id: string;
      input_param_values: Record<string, any>;
      input_created_by: string;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .rpc('create_generated_task', payload);
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generated-tasks'] });
      
      if (data.existing_task) {
        toast({
          title: "Tarea Existente",
          description: `Ya existe una tarea con estos parámetros: ${data.existing_task.code}`,
          variant: "default"
        });
        return data.existing_task;
      } else {
        toast({
          title: "Tarea Generada",
          description: "La tarea generada se ha creado exitosamente",
          variant: "default"
        });
        return data.new_task;
      }
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