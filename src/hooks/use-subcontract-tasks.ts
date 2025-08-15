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

      // Buscar la bid de definición de alcance para este subcontrato
      const { data: scopeBid, error: bidError } = await supabase
        .from('subcontract_bids')
        .select('id')
        .eq('subcontract_id', subcontractId)
        .eq('organization_id', userData.organization.id)
        .eq('status', 'scope_definition')
        .single();

      if (bidError && bidError.code !== 'PGRST116') {
        console.error('Error fetching scope bid:', bidError);
        throw bidError;
      }

      if (!scopeBid) {
        // No hay bid de alcance, retornar array vacío
        return [];
      }

      // Obtener las tareas de esta bid
      const { data, error } = await supabase
        .from('subcontract_bid_tasks')
        .select(`
          id,
          bid_id,
          task_id,
          quantity,
          unit,
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
        .eq('bid_id', scopeBid.id)
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

      // Primero crear una bid por defecto para este subcontrato si no existe
      // La tabla SUBCONTRACT_BID_TASKS necesita un bid_id
      const { data: existingBid, error: bidError } = await supabase
        .from('subcontract_bids')
        .select('id')
        .eq('subcontract_id', subcontractId)
        .eq('organization_id', userData.organization.id)
        .single();

      let bidId = existingBid?.id;

      if (!bidId) {
        // Crear una bid por defecto para almacenar las tareas del alcance
        const { data: newBid, error: createBidError } = await supabase
          .from('subcontract_bids')
          .insert({
            subcontract_id: subcontractId,
            organization_id: userData.organization.id,
            provider_id: null, // Bid interna para alcance
            status: 'scope_definition',
            notes: 'Alcance del subcontrato'
          })
          .select('id')
          .single();

        if (createBidError) throw createBidError;
        bidId = newBid.id;
      }

      // Ahora insertar las tareas en SUBCONTRACT_BID_TASKS
      const tasksToInsert = tasks.map(task => ({
        bid_id: bidId,
        task_id: task.task_id,
        quantity: task.quantity || 1,
        unit: task.unit || '',
        notes: task.notes || ''
      }));

      const { data, error } = await supabase
        .from('subcontract_bid_tasks')
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
        .from('subcontract_bid_tasks')
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