import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { InsertMovementTask } from '../../shared/schema';

export function useMovementTasks(movementId?: string) {
  return useQuery({
    queryKey: ['movement-tasks', movementId],
    queryFn: async () => {
      if (!movementId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('movement_tasks')
        .select(`
          id,
          movement_id,
          task_id
        `)
        .eq('movement_id', movementId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!movementId && !!supabase
  });
}

export function useCreateMovementTasks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ movementId, taskIds }: { movementId: string; taskIds: string[] }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Primero eliminar todas las tareas existentes para este movimiento
      const { error: deleteError } = await supabase
        .from('movement_tasks')
        .delete()
        .eq('movement_id', movementId);
      
      if (deleteError) throw deleteError;
      
      // Luego insertar las nuevas tareas
      if (taskIds.length > 0) {
        const insertData: InsertMovementTask[] = taskIds.map(taskId => ({
          movement_id: movementId,
          task_id: taskId
        }));
        
        const { data, error: insertError } = await supabase
          .from('movement_tasks')
          .insert(insertData)
          .select();
        
        if (insertError) throw insertError;
        return data;
      }
      
      return [];
    },
    onSuccess: (_, variables) => {
      // Invalidar cache de tareas del movimiento
      queryClient.invalidateQueries({ queryKey: ['movement-tasks', variables.movementId] });
      // También invalidar cache general de movimientos
      queryClient.invalidateQueries({ queryKey: ['movements'] });
    }
  });
}