import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface Action {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export function useActions() {
  return useQuery({
    queryKey: ['actions'],
    queryFn: async (): Promise<Action[]> => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching actions:', error);
        throw error;
      }

      return data || [];
    },
  });
}

export function useDeleteAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('actions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      toast({
        title: "Acción eliminada",
        description: "La acción ha sido eliminada correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error deleting action:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la acción.",
        variant: "destructive",
      });
    },
  });
}