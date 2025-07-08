import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TaskSearchResult {
  id: string;
  code: string;
  display_name: string;
  template_id: string;
  param_values: any;
  is_public: boolean;
  organization_id: string;
}

export function useTaskSearch(searchTerm: string, organizationId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["task-search", searchTerm, organizationId],
    queryFn: async (): Promise<TaskSearchResult[]> => {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      if (!searchTerm || searchTerm.length < 3) {
        return [];
      }

      const { data, error } = await supabase
        .from("task_generated_view")
        .select("*")
        .eq("organization_id", organizationId)
        .ilike("display_name", `%${searchTerm}%`)
        .limit(20);

      if (error) {
        console.error("Error searching tasks:", error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled && !!supabase && !!organizationId && searchTerm.length >= 3
  });
}