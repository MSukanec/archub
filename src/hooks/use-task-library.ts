import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TaskLibraryItem {
  id: string;
  code: string;
  template_id: string;
  param_values: Record<string, any>;
  organization_id: string;
  created_at: string;
  unit_id: string;
  task_group_id: string;
  task_group_name: string;
  category_id: string;
  category_name: string;
  category_code: string;
  subcategory_id: string;
  subcategory_name: string;
  subcategory_code: string;
  rubro_id: string;
  rubro_name: string;
  rubro_code: string;
  display_name: string;
}

export function useTaskLibrary(organizationId: string) {
  return useQuery({
    queryKey: ['task-library', organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('task_parametric_view')
        .select('*')
        .eq('organization_id', organizationId)
        .order('display_name', { ascending: true });
      
      if (error) throw error;
      return data as TaskLibraryItem[];
    },
    enabled: !!organizationId && !!supabase
  });
}