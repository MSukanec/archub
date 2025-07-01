import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './use-current-user';

export interface DesignTask {
  id: string;
  design_phase_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  design_phase?: {
    id: string;
    name: string;
  };
}

export interface CreateDesignTaskData {
  design_phase_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  assigned_to?: string;
}

export interface UpdateDesignTaskData extends CreateDesignTaskData {
  id: string;
}

export function useDesignTasks(projectId: string) {
  return useQuery({
    queryKey: ['design-tasks', projectId],
    queryFn: async () => {
      console.log('Fetching design tasks for project:', projectId);
      
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('design_tasks')
        .select(`
          *,
          design_phase:design_phases(id, name),
          assigned_user:contacts(id, full_name, email, avatar_url)
        `)
        .eq('design_phases.project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching design tasks:', error);
        // Si las tablas no existen o hay error de columna, retornar array vacío
        if (error.code === '42P01' || error.code === '42703') {
          return [];
        }
        throw error;
      }

      return data as DesignTask[];
    },
    enabled: !!projectId
  });
}

export function useCreateDesignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateDesignTaskData) => {
      const { data, error } = await supabase
        .from('design_tasks')
        .insert([taskData])
        .select(`
          *,
          design_phase:design_phases(id, name),
          assigned_user:contacts(id, full_name, email, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Error creating design task:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['design-phases'] });
    }
  });
}

export function useUpdateDesignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateDesignTaskData) => {
      const { data, error } = await supabase
        .from('design_tasks')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          design_phase:design_phases(id, name),
          assigned_user:contacts(id, full_name, email, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Error updating design task:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-tasks'] });
    }
  });
}

export function useDeleteDesignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('design_tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting design task:', error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-tasks'] });
    }
  });
}