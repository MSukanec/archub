import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useBudgetTasks(budgetId: string | undefined) {
  return useQuery({
    queryKey: ['budget-tasks', budgetId],
    queryFn: async () => {
      if (!supabase || !budgetId) {
        return [];
      }

      console.log('Fetching budget tasks for budget:', budgetId);

      const { data, error } = await supabase
        .from('budget_tasks')
        .select('*')
        .eq('budget_id', budgetId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching budget tasks:', error);
        throw error;
      }

      console.log('Budget tasks data received:', data);
      return data || [];
    },
    enabled: !!supabase && !!budgetId
  });
}

export function useCreateBudgetTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskData: any) => {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('budget_tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch budget tasks
      queryClient.invalidateQueries({ queryKey: ['budget-tasks', variables.budget_id] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      
      toast({
        title: "Tarea creada",
        description: "La nueva tarea ha sido agregada al presupuesto correctamente",
      });
    },
    onError: (error) => {
      console.error('Error creating budget task:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarea del presupuesto",
        variant: "destructive",
      });
    }
  });
}

export function useUpdateBudgetTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, taskData }: { id: string; taskData: any }) => {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('budget_tasks')
        .update(taskData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch budget tasks
      queryClient.invalidateQueries({ queryKey: ['budget-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      
      toast({
        title: "Tarea actualizada",
        description: "La tarea del presupuesto ha sido actualizada correctamente",
      });
    },
    onError: (error) => {
      console.error('Error updating budget task:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea del presupuesto",
        variant: "destructive",
      });
    }
  });
}

export function useDeleteBudgetTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('budget_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate and refetch budget tasks
      queryClient.invalidateQueries({ queryKey: ['budget-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada del presupuesto correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deleting budget task:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea del presupuesto",
        variant: "destructive",
      });
    }
  });
}