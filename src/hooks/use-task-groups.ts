import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface TaskGroup {
  id: string;
  name: string;
  category_id: string;
  template_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskGroupData {
  name: string;
  category_id: string;
}

export interface UpdateTaskGroupData extends CreateTaskGroupData {
  id: string;
}

export function useTaskGroups() {
  return useQuery({
    queryKey: ['task-groups'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await supabase
        .from('task_groups')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching task groups:', error);
        throw error;
      }

      return data || [];
    },
  });
}

export function useTaskGroupsByCategory(categoryId: string) {
  return useQuery({
    queryKey: ['task-groups', categoryId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await supabase
        .from('task_groups')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');

      if (error) {
        console.error('Error fetching task groups by category:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!categoryId,
  });
}

export function useCreateTaskGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskGroupData: CreateTaskGroupData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase
        .from('task_groups')
        .insert([taskGroupData])
        .select()
        .single();

      if (error) {
        console.error('Error creating task group:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      queryClient.invalidateQueries({ queryKey: ['task-categories-admin'] });
      toast({
        title: "Grupo de tareas creado",
        description: "El grupo de tareas se ha creado exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Create task group error:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el grupo de tareas. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTaskGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateTaskGroupData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase
        .from('task_groups')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task group:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      queryClient.invalidateQueries({ queryKey: ['task-categories-admin'] });
      toast({
        title: "Grupo de tareas actualizado",
        description: "El grupo de tareas se ha actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Update task group error:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el grupo de tareas. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTaskGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskGroupId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { error } = await supabase
        .from('task_groups')
        .delete()
        .eq('id', taskGroupId);

      if (error) {
        console.error('Error deleting task group:', error);
        throw error;
      }

      return taskGroupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      queryClient.invalidateQueries({ queryKey: ['task-categories-admin'] });
      toast({
        title: "Grupo de tareas eliminado",
        description: "El grupo de tareas se ha eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Delete task group error:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el grupo de tareas. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}