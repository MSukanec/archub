import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface TaskKind {
  id: string;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTaskKinds() {
  return useQuery({
    queryKey: ['task-kinds'],
    queryFn: async (): Promise<TaskKind[]> => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('task_kind')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching task kinds:', error);
        throw error;
      }

      return data || [];
    },
  });
}

export function useDeleteTaskKind() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('task_kind')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-kinds'] });
      toast({
        title: "Acción eliminada",
        description: "La acción ha sido eliminada correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error deleting task kind:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la acción.",
        variant: "destructive",
      });
    },
  });
}