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
  // Datos de la tarea relacionada (task_generated_view)
  task: {
    id: string;
    code: string;
    template_id: string | null;
    param_values: any;
    organization_id: string;
    name_template: string;
    unit_id: string | null;
    unit_name: string | null;
    task_code: string;
    task_group_id: string | null;
    task_group_name: string | null;
    category_id: string | null;
    category_name: string | null;
    category_code: string | null;
    rubro_name: string | null;
    display_name?: string;
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
          task:task_generated_view(
            id,
            code,
            template_id,
            param_values,
            organization_id,
            name_template,
            unit_id,
            unit_name,
            task_code,
            task_group_id,
            task_group_name,
            category_id,
            category_name,
            category_code,
            rubro_name
          )
        `)
        .eq("budget_id", budgetId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching budget tasks:", error);
        throw error;
      }

      console.log("Budget tasks data received:", data);
      
      // Procesar los nombres de las tareas usando la función del taskDescriptionGenerator
      const processedTasks = await Promise.all(
        (data || []).map(async (task: any) => {
          if (task.task?.name_template && task.task?.param_values) {
            console.log('Processing task with template:', task.task.name_template, 'and params:', task.task.param_values);
            
            // Usar la función generateTaskDescription para procesar correctamente todos los tipos de parámetros
            const { generateTaskDescription } = await import('@/utils/taskDescriptionGenerator');
            
            try {
              const processedName = await generateTaskDescription(
                task.task.name_template,
                task.task.param_values
              );
              
              console.log('Final processed name:', processedName);
              task.task.display_name = processedName;
            } catch (error) {
              console.error('Error processing task description:', error);
              // Usar name_template como fallback
              task.task.display_name = task.task.name_template;
            }
          } else if (task.task?.code) {
            // Si no hay template, usar el código de la tarea
            task.task.display_name = task.task.code;
          }
          return task;
        })
      );
      
      return processedTasks;
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