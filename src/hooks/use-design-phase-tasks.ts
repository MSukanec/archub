import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DesignPhaseTask, InsertDesignPhaseTask } from '../../shared/schema';

export interface DesignPhaseTaskWithDetails extends DesignPhaseTask {
  design_task: {
    id: string;
    name: string;
    description: string | null;
  };
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function useDesignPhaseTasks(projectPhaseId: string) {
  return useQuery({
    queryKey: ['design-phase-tasks', projectPhaseId],
    queryFn: async (): Promise<DesignPhaseTaskWithDetails[]> => {
      console.log('Fetching design phase tasks for project phase:', projectPhaseId);
      
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('design_phase_tasks')
        .select(`
          *,
          design_task:design_tasks(
            id,
            name,
            description
          ),
          assigned_user:contacts(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('project_phase_id', projectPhaseId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching design phase tasks:', error);
        throw error;
      }

      return data as DesignPhaseTaskWithDetails[];
    },
    enabled: !!projectPhaseId
  });
}

export function useAllDesignPhaseTasksForProject(projectId: string) {
  return useQuery({
    queryKey: ['design-phase-tasks-project', projectId],
    queryFn: async (): Promise<DesignPhaseTaskWithDetails[]> => {
      console.log('Fetching all design phase tasks for project:', projectId);
      
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('design_phase_tasks')
        .select(`
          *,
          design_task:design_tasks(
            id,
            name,
            description
          ),
          assigned_user:contacts(
            id,
            full_name,
            email,
            avatar_url
          ),
          project_phase:design_project_phases!inner(
            id,
            project_id,
            name
          )
        `)
        .eq('design_project_phases.project_id', projectId)
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching design phase tasks for project:', error);
        throw error;
      }

      return data as DesignPhaseTaskWithDetails[];
    },
    enabled: !!projectId
  });
}

export function useCreateDesignPhaseTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: InsertDesignPhaseTask) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('design_phase_tasks')
        .insert([{
          ...taskData,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating design phase task:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-phase-tasks'] });
    },
  });
}

export function useUpdateDesignPhaseTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: InsertDesignPhaseTask & { id: string }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('design_phase_tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating design phase task:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-phase-tasks'] });
    },
  });
}

export function useDeleteDesignPhaseTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('design_phase_tasks')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error deleting design phase task:', error);
        throw error;
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-phase-tasks'] });
    },
  });
}