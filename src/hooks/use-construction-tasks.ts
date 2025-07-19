import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface ConstructionTask {
  id: string;
  organization_id: string;
  project_id: string;
  task_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  task: {
    id: string;
    code: string;
    display_name: string;
    rubro_name: string | null;
    category_name: string | null;
    unit_id: string | null;
    rubro_id: string | null;
    unit?: {
      id: string;
      name: string;
      symbol: string;
    };
  };
}

export function useConstructionTasks(projectId: string, organizationId: string) {
  return useQuery({
    queryKey: ['construction-tasks', projectId, organizationId],
    queryFn: async (): Promise<ConstructionTask[]> => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
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
            unit:units (
              id,
              name,
              symbol
            )
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching construction tasks:', error);
        throw error;
      }

      return data || [];
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
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('construction_tasks')
        .insert(taskData)
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
            unit:units (
              id,
              name,
              symbol
            )
          )
        `)
        .single();

      if (error) {
        console.error('Error creating construction task:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks', data.project_id, data.organization_id] 
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
      quantity: number;
      project_id: string;
      organization_id: string;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data: result, error } = await supabase
        .from('construction_tasks')
        .update({ 
          quantity: data.quantity,
          updated_at: new Date().toISOString()
        })
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

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks', data.project_id, data.organization_id] 
      });
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