import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface TaskDivisionAdmin {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  code?: string;
  parent_id?: string | null;
  organization_id: string | null;
  is_system: boolean;
  order?: number;
  created_at: string;
  updated_at?: string;
  children?: TaskDivisionAdmin[]; // Keep for compatibility with HierarchicalTree
}

export interface CreateTaskDivisionData {
  name: string;
  name_en?: string;
  description?: string;
  code?: string;
  parent_id?: string | null;
  organization_id?: string | null;
  is_system?: boolean;
  order?: number;
}

export interface UpdateTaskDivisionData extends CreateTaskDivisionData {
  id: string;
}

export function useAllTaskDivisions() {
  return useQuery({
    queryKey: ['all-task-divisions'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data: divisions, error } = await supabase
        .from('task_divisions')
        .select('*')
        .order('order', { ascending: true, nullsFirst: false })
        .order('name');

      if (error) {
        throw error;
      }

      return divisions || [];
    },
  });
}

export function useTaskDivisionsAdmin() {
  return useQuery({
    queryKey: ['task-divisions-admin'],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Fetch divisions - simplified since they're not hierarchical
      const { data: divisions, error: divisionsError } = await supabase
        .from('task_divisions')
        .select('*')
        .order('order', { ascending: true, nullsFirst: false })
        .order('name');

      if (divisionsError) {
        throw divisionsError;
      }

      // Build hierarchical structure from flat data using parent_id
      const buildHierarchy = (items: any[], parentId: string | null = null): TaskDivisionAdmin[] => {
        return items
          .filter(item => item.parent_id === parentId)
          .map(item => ({
            ...item,
            children: buildHierarchy(items, item.id)
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
      };

      const divisionsWithChildren = buildHierarchy(divisions);
      return divisionsWithChildren;
    },
  });
}

export function useCreateTaskDivision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (divisionData: CreateTaskDivisionData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase
        .from('task_divisions')
        .insert([divisionData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-divisions-admin'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-divisions'] });
      toast({
        title: "División creada",
        description: "La división se ha creado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo crear la división. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTaskDivision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateTaskDivisionData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase
        .from('task_divisions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-divisions-admin'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-divisions'] });
      toast({
        title: "División actualizada",
        description: "La división se ha actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la división. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTaskDivision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { error } = await supabase
        .from('task_divisions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-divisions-admin'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-divisions'] });
      toast({
        title: "División eliminada",
        description: "La división se ha eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la división. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTaskDivisionsOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (divisions: { id: string; order: number }[]) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      // Update multiple records with their new order values
      const updates = divisions.map(async (division) => {
        const { error } = await supabase
          .from('task_divisions')
          .update({ order: division.order })
          .eq('id', division.id);

        if (error) {
          throw error;
        }
      });

      // Wait for all updates to complete
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-divisions-admin'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-divisions'] });
      toast({
        title: "Orden actualizado",
        description: "El orden de las divisiones se ha actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de las divisiones. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}