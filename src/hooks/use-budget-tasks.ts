import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export interface BudgetTask {
  id: string;
  budget_id: string;
  task_id: string;
  quantity: number;
  start_date: string | null;
  end_date: string | null;
  planned_days: number | null;
  priority: string | null;
  dependencies: string[];
  organization_id: string;
  created_at: string;
  updated_at: string;
  // Datos de la tarea relacionada con categoría y unidad
  task: {
    id: string;
    name: string;
    description: string;
    unit_labor_price: number;
    unit_material_price: number;
    category_id: string | null;
    unit_id: string | null;
    task_categories: {
      id: string;
      name: string;
    } | null;
    units: {
      id: string;
      name: string;
      symbol: string;
    } | null;
  };
}

export interface CreateBudgetTaskData {
  budget_id: string;
  task_id: string;
  quantity: number;
  start_date?: string | null;
  end_date?: string | null;
  planned_days?: number | null;
  priority?: string | null;
  dependencies?: string[];
  organization_id: string;
}

export interface UpdateBudgetTaskData extends CreateBudgetTaskData {
  id: string;
}

export function useBudgetTasks(budgetId: string) {
  const queryClient = useQueryClient();

  // Obtener tareas del presupuesto
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

      const { data, error } = await supabase
        .from("budget_tasks")
        .select(`
          *,
          task:tasks(
            id,
            name,
            description,
            unit_labor_price,
            unit_material_price,
            category_id,
            unit_id,
            task_categories!tasks_category_id_fkey(
              id,
              name
            ),
            units(
              id,
              name,
              symbol
            )
          )
        `)
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

  // Crear tarea en presupuesto
  const createBudgetTask = useMutation({
    mutationFn: async (taskData: CreateBudgetTaskData) => {
      console.log("Creating budget task:", taskData);
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabase
        .from("budget_tasks")
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error("Error creating budget task:", error);
        throw error;
      }

      console.log("Budget task created:", data);
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
    mutationFn: async ({ id, ...updateData }: UpdateBudgetTaskData) => {
      console.log("Updating budget task:", id, updateData);
      
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
        console.error("Error updating budget task:", error);
        throw error;
      }

      console.log("Budget task updated:", data);
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

  // Eliminar tarea del presupuesto
  const deleteBudgetTask = useMutation({
    mutationFn: async (taskId: string) => {
      console.log("Deleting budget task:", taskId);
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { error } = await supabase
        .from("budget_tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        console.error("Error deleting budget task:", error);
        throw error;
      }

      console.log("Budget task deleted successfully");
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
    updateBudgetTask,
    deleteBudgetTask
  };
}