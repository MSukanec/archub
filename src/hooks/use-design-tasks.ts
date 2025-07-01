import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DesignTask {
  id: string;
  project_phase_id: string;
  name: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  assigned_to?: string | null;
  status: string;
  priority: string;
  position: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface CreateDesignTaskData {
  project_phase_id: string;
  name: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  assigned_to?: string | null;
  status: string;
  priority: string;
  created_by: string;
  organization_id: string;
}

export function useDesignTasks(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['design-tasks', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      console.log('Fetching design tasks for project:', organizationId);
      
      const { data, error } = await supabase
        .from('design_phase_tasks')
        .select('*')
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching design tasks:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!organizationId,
  });
}

export function useCreateDesignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateDesignTaskData) => {
      const { data, error } = await supabase
        .from('design_phase_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Error creating design task:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design-tasks'] });
    },
  });
}

export function useUpdateDesignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<CreateDesignTaskData>) => {
      const { data, error } = await supabase
        .from('design_phase_tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating design task:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-tasks'] });
    },
  });
}

export function useDeleteDesignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('design_phase_tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting design task:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-tasks'] });
    },
  });
}