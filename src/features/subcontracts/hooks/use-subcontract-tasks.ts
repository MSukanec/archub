import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSubcontractTasks,
  createSubcontractTasks,
  deleteSubcontractTask,
  updateSubcontractTask,
  type SubcontractTaskData,
  type CreateSubcontractTaskData,
  type UpdateSubcontractTaskData,
} from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';

export function useSubcontractTasks(subcontractId: string) {
  const queryClient = useQueryClient();

  const { data: subcontractTasks = [], isLoading, error } = useQuery<SubcontractTaskData[]>({
    queryKey: SUBCONTRACT_QUERY_KEYS.tasks(subcontractId),
    queryFn: () => getSubcontractTasks(subcontractId),
    enabled: !!subcontractId,
  });

  const createMultipleSubcontractTasks = useMutation({
    mutationFn: (tasks: CreateSubcontractTaskData[]) => 
      createSubcontractTasks(subcontractId, tasks),
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Tareas agregadas al subcontrato correctamente',
      });
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.tasks(subcontractId) 
      });
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

  const deleteSubcontractTaskMutation = useMutation({
    mutationFn: (taskId: string) => deleteSubcontractTask(taskId),
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Tarea eliminada del subcontrato',
      });
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.tasks(subcontractId) 
      });
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

  const updateSubcontractTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: UpdateSubcontractTaskData }) => 
      updateSubcontractTask(taskId, updates),
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Tarea actualizada correctamente',
      });
      queryClient.invalidateQueries({ 
        queryKey: SUBCONTRACT_QUERY_KEYS.tasks(subcontractId) 
      });
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
    deleteSubcontractTask: deleteSubcontractTaskMutation,
    updateSubcontractTask: updateSubcontractTaskMutation,
  };
}
