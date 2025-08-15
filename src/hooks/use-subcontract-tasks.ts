import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

export function useSubcontractTasks(subcontractId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();

  // Query para obtener las tareas del subcontrato
  const { data: subcontractTasks = [], isLoading, error } = useQuery({
    queryKey: ['subcontract-tasks', subcontractId],
    queryFn: async () => {
      if (!subcontractId || !userData?.organization?.id) {
        return [];
      }

      // Obtener las tareas directamente de SUBCONTRACT_TASKS
      const { data, error } = await supabase
        .from('subcontract_tasks')
        .select(`
          id,
          subcontract_id,
          task_id,
          unit,
          amount,
          notes,
          created_at,
          task_instances!inner (
            id,
            name,
            description,
            unit,
            task_template_id,
            task_templates (
              name,
              description,
              unit
            )
          )
        `)
        .eq('subcontract_id', subcontractId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subcontract tasks:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!subcontractId && !!userData?.organization?.id
  });

  // Mutation para crear múltiples tareas del subcontrato
  const createMultipleSubcontractTasks = useMutation({
    mutationFn: async (tasks: any[]) => {
      if (!userData?.organization?.id) {
        throw new Error('No organization found');
      }

      // Insertar las tareas directamente en SUBCONTRACT_TASKS
      const tasksToInsert = tasks.map(task => ({
        subcontract_id: subcontractId,
        task_id: task.task_id,
        unit: task.unit || '',
        amount: task.quantity || 1,
        notes: task.notes || ''
      }));

      const { data, error } = await supabase
        .from('subcontract_tasks')
        .insert(tasksToInsert);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Tareas agregadas al subcontrato correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['subcontract-tasks', subcontractId] });
    },
    onError: (error) => {
      console.error('Error creating subcontract tasks:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron agregar las tareas al subcontrato',
        variant: 'destructive',
      });
    },
  });

  // Mutation para eliminar una tarea del subcontrato
  const deleteSubcontractTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('subcontract_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Tarea eliminada del subcontrato',
      });
      queryClient.invalidateQueries({ queryKey: ['subcontract-tasks', subcontractId] });
    },
    onError: (error) => {
      console.error('Error deleting subcontract task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la tarea del subcontrato',
        variant: 'destructive',
      });
    },
  });

  // Mutation para actualizar una tarea del subcontrato
  const updateSubcontractTask = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      const { data, error } = await supabase
        .from('subcontract_bid_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Tarea actualizada correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['subcontract-tasks', subcontractId] });
    },
    onError: (error) => {
      console.error('Error updating subcontract task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tarea',
        variant: 'destructive',
      });
    },
  });

  return {
    subcontractTasks,
    isLoading,
    error,
    createMultipleSubcontractTasks,
    deleteSubcontractTask,
    updateSubcontractTask
  };
}