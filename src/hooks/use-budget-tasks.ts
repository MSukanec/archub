import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export interface BudgetTask {
  id: string;
  budget_id: string;
  task_id: string;
  organization_id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  // Datos de la tarea relacionada (construction_gantt_view)
  task: {
    task_instance_id: string;
    project_id: string;
    task_id: string;
    task_code: string;
    start_date: string | null;
    end_date: string | null;
    duration_in_days: number | null;
    quantity: number;
    phase_instance_id: string;
    phase_name: string;
    progress_percent: number;
    unit_id: string;
    unit_name: string;
    unit_symbol: string;
    display_name: string;
    subcategory_id: string;
    subcategory_name: string;
    category_id: string;
    category_name: string;
    rubro_id: string;
    rubro_name: string;
    task_group_id: string;
    task_group_name: string;
  };
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

      // Obtener las tareas del presupuesto
      const { data, error } = await supabase
        .from("budget_tasks")
        .select("*")
        .eq("budget_id", budgetId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching budget tasks:", error);
        throw error;
      }

      console.log("Budget tasks data received:", data);
      
      if (!data || data.length === 0) {
        return [];
      }

      // Ahora obtener los datos de las tareas desde construction_gantt_view
      const taskIds = data.map(task => task.task_id);
      const { data: tasksData, error: tasksError } = await supabase
        .from("construction_gantt_view")
        .select("*")
        .in("task_instance_id", taskIds);

      if (tasksError) {
        console.error("Error fetching construction tasks data:", tasksError);
        throw tasksError;
      }

      // Combinar los datos
      const enrichedData = data.map(budgetTask => {
        const taskData = tasksData?.find(t => t.task_instance_id === budgetTask.task_id);
        return {
          ...budgetTask,
          task: taskData || null
        };
      });

      console.log("Sample enriched budget task:", enrichedData[0]);
      return enrichedData;
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

  // Crear múltiples tareas en presupuesto (bulk)
  const createMultipleBudgetTasks = useMutation({
    mutationFn: async (tasksData: CreateBudgetTaskData[]) => {
      console.log("Creating multiple budget tasks:", tasksData.length, "tasks");
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabase
        .from("budget_tasks")
        .insert(tasksData)
        .select();

      if (error) {
        console.error("Error creating multiple budget tasks:", error);
        throw error;
      }

      console.log("Multiple budget tasks created:", data.length, "tasks");
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
    createMultipleBudgetTasks,
    updateBudgetTask,
    deleteBudgetTask
  };
}