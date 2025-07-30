import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Hook temporal para debuggear
export function useDebugTasks(organizationId: string) {
  return useQuery({
    queryKey: ["debug-tasks", organizationId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }


      // Verificar task_generated
      const { data: taskGenerated, error: taskGeneratedError } = await supabase
        .from("task_generated")
        .select("*")
        .eq("organization_id", organizationId)
        .limit(5);


      // Verificar task_parametric_view
      const { data: taskParametricView, error: taskParametricViewError } = await supabase
        .from("task_parametric_view")
        .select("*")
        .eq("organization_id", organizationId)
        .limit(5);


      return {
        taskGenerated,
        taskParametricView,
        taskGeneratedError,
        taskParametricViewError
      };
    },
    enabled: !!supabase && !!organizationId
  });
}