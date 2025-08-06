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
      console.log("Fetching budget tasks for budget:", budgetId);
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Obtener directamente desde construction_tasks_view filtrando por budget_id
      const { data, error } = await supabase
        .from("construction_tasks_view")
        .select("*")
        .eq("budget_id", budgetId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching budget tasks:", error);
        throw error;
      }

      console.log("Budget tasks data received:", data);
      
      return data || [];
    },
    enabled: !!budgetId && !!supabase
  });

  // Agregar tarea al presupuesto (actualizar campo budget_id en construction_tasks)
  const createBudgetTask = useMutation({
    mutationFn: async (taskData: CreateBudgetTaskData) => {
      console.log("Adding task to budget:", taskData);
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabase
        .from("construction_tasks")
        .update({ budget_id: taskData.budget_id })
        .eq("id", taskData.task_id)
        .select()
        .single();

      if (error) {
        console.error("Error adding task to budget:", error);
        throw error;
      }

      console.log("Task added to budget:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-tasks", budgetId] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (error) => {
      console.error("Error in createBudgetTask mutation:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar la tarea al presupuesto",
        variant: "destructive"
      });
    }
  });

  // Actualizar tarea en presupuesto
  const updateBudgetTask = useMutation({
    mutationFn: async ({ id, budget_id }: { id: string; budget_id: string }) => {
      console.log("Updating task budget assignment:", id, budget_id);
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabase
        .from("construction_tasks")
        .update({ budget_id })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating task budget assignment:", error);
        throw error;
      }

      console.log("Task budget assignment updated:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-tasks", budgetId] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (error) => {
      console.error("Error in updateBudgetTask mutation:", error);
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
      console.log("Adding multiple tasks to budget:", tasksData.length, "tasks");
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const taskIds = tasksData.map(task => task.task_id);
      const budgetId = tasksData[0]?.budget_id;

      const { data, error } = await supabase
        .from("construction_tasks")
        .update({ budget_id: budgetId })
        .in("id", taskIds)
        .select();

      if (error) {
        console.error("Error adding multiple tasks to budget:", error);
        throw error;
      }

      console.log("Multiple tasks added to budget:", data.length, "tasks");
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
      console.error("Error in createMultipleBudgetTasks mutation:", error);
      toast({
        title: "Error",
        description: "No se pudieron agregar las tareas al presupuesto",
        variant: "destructive"
      });
    }
  });

  // Remover tarea del presupuesto (quitar budget_id)
  const deleteBudgetTask = useMutation({
    mutationFn: async (taskId: string) => {
      console.log("Removing task from budget:", taskId);
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { error } = await supabase
        .from("construction_tasks")
        .update({ budget_id: null })
        .eq("id", taskId);

      if (error) {
        console.error("Error removing task from budget:", error);
        throw error;
      }

      console.log("Task removed from budget successfully");
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
      console.error("Error in deleteBudgetTask mutation:", error);
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