import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface ConstructionTask {
  id: string;
  organization_id: string;
  project_id: string;
  task_id: string;
  quantity: number;
  created_by: string;
  start_date?: string;
  end_date?: string;
  duration_in_days?: number;
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
    param_values: any;
    units?: {
      id: string;
      name: string;
      symbol: string;
    } | null;
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
            param_values,
            units (
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
      created_by: string;
      start_date?: string;
      end_date?: string;
      duration_in_days?: number;
      project_phase_id?: string; // ID de la fase del proyecto (construction_project_phases.id)
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