import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export interface BudgetTask {
  id: string;
  project_id: string;
  task_id: string;
  name_rendered: string;
  category_name: string;
  quantity: number;
  start_date: string | null;
  end_date: string | null;
  duration_in_days: number | null;
  progress_percent: number;
  phase_name: string | null;
  created_at: string;
  updated_at: string;
  budget_id: string;
}

export interface CreateBudgetTaskData {
  budget_id: string;
  task_id: string;
  organization_id: string;
  project_id: string;
}

export interface UpdateBudgetTaskData extends CreateBudgetTaskData {
  id: string;
}

export function useBudgetTasks(budgetId: string) {
  const queryClient = useQueryClient();

  // Obtener tareas del presupuesto directamente desde construction_tasks_view
  const {
    data: budgetTasks = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ["budget-tasks", budgetId],
    queryFn: async (): Promise<BudgetTask[]> => {
// Eliminado log de fetching budget tasks
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Obtener los IDs de las tareas desde la tabla budget_tasks
      const { data: budgetTasksData, error: budgetError } = await supabase
        .from("budget_tasks")
        .select("task_id")
        .eq("budget_id", budgetId);

      if (budgetError) {
        throw budgetError;
      }

      if (!budgetTasksData || budgetTasksData.length === 0) {
        return [];
      }

      // Obtener los datos completos desde construction_tasks_view
      const taskIds = budgetTasksData.map(item => item.task_id);
      const { data, error } = await supabase
        .from("construction_tasks_view")
        .select("*")
        .in("id", taskIds)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      
      // Agregar budget_id a cada tarea para mantener consistencia
      const tasksWithBudgetId = data?.map(task => ({
        ...task,
        budget_id: budgetId
      })) || [];

      return tasksWithBudgetId;
    },
    enabled: !!budgetId && !!supabase
  });

  // Agregar tarea al presupuesto usando budget_tasks
  const createBudgetTask = useMutation({
    mutationFn: async (taskData: CreateBudgetTaskData) => {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabase
        .from("budget_tasks")
        .insert(taskData)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-tasks", budgetId] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (error) => {

      toast({
        title: "Error",
        description: "No se pudo agregar la tarea al presupuesto",
        variant: "destructive"
      });
    }
  });

  // Actualizar tarea en presupuesto usando budget_tasks
  const updateBudgetTask = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateBudgetTaskData) => {

      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabase
        .from("budget_tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {

        throw error;
      }


      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-tasks", budgetId] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (error) => {

      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea del presupuesto",
        variant: "destructive"
      });
    }
  });

  // Agregar múltiples tareas al presupuesto (bulk)
  const createMultipleBudgetTasks = useMutation({
    mutationFn: async (tasksData: CreateBudgetTaskData[]) => {

      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabase
        .from("budget_tasks")
        .insert(tasksData)
        .select();

      if (error) {

        throw error;
      }


      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-tasks", budgetId] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Tareas agregadas",
        description: "Las tareas se agregaron al presupuesto correctamente"
      });
    },
    onError: (error) => {

      toast({
        title: "Error",
        description: "No se pudieron agregar las tareas al presupuesto",
        variant: "destructive"
      });
    }
  });

  // Remover tarea del presupuesto eliminando de budget_tasks
  const deleteBudgetTask = useMutation({
    mutationFn: async (taskId: string) => {

      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { error } = await supabase
        .from("budget_tasks")
        .delete()
        .eq("task_id", taskId);

      if (error) {

        throw error;
      }


    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-tasks", budgetId] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Tarea eliminada",
        description: "La tarea se eliminó del presupuesto correctamente"
      });
    },
    onError: (error) => {

      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea del presupuesto",
        variant: "destructive"
      });
    }
  });

  return {
    budgetTasks,
    isLoading,
    error,
    createBudgetTask,
    createMultipleBudgetTasks,
    updateBudgetTask,
    deleteBudgetTask
  };
}