import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ConstructionTaskSearchResult {
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
}

export interface ConstructionTaskSearchFilters {
  rubro?: string;
  category?: string;
  phase_id?: string;
}

export function useConstructionTaskSearch(
  organizationId: string,
  projectId: string,
  searchTerm: string,
  filters: ConstructionTaskSearchFilters = {},
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["construction-task-search", organizationId, projectId, searchTerm, filters],
    queryFn: async (): Promise<ConstructionTaskSearchResult[]> => {
      console.log("Searching construction tasks:", { organizationId, projectId, searchTerm, filters });
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Usar directamente la vista construction_gantt_view - ya tiene todos los datos necesarios
      let query = supabase
        .from("construction_tasks_view")
        .select("*")
        .eq("project_id", projectId);

      // Filtrar por rubro si se especifica
      if (filters.rubro) {
        query = query.eq('rubro_name', filters.rubro);
      }

      // Filtrar por categoría si se especifica
      if (filters.category) {
        query = query.eq('category_name', filters.category);
      }

      // Filtrar por fase si se especifica
      if (filters.phase_id) {
        query = query.eq('phase_instance_id', filters.phase_id);
      }

      const { data: allTasks, error } = await query;

      if (error) {
        console.error("Error searching construction tasks:", error);
        throw error;
      }
      
      // Filtrar por término de búsqueda en display_name y task_code
      const filteredData = (allTasks || []).filter(task => 
        task.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.task_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      console.log("Construction tasks search results:", filteredData.length);
      return filteredData;
    },
    enabled: enabled && !!supabase && !!projectId && searchTerm.length >= 3
  });
}

// Hook para obtener opciones de filtros de construction tasks
export function useConstructionTaskSearchFilterOptions(organizationId: string, projectId: string) {
  return useQuery({
    queryKey: ["construction-task-search-filter-options", organizationId, projectId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabase
        .from("construction_gantt_view")
        .select("rubro_name, category_name")
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching filter options:", error);
        throw error;
      }

      // Extraer valores únicos
      const rubros = [...new Set(data?.map(item => item.rubro_name).filter(Boolean) || [])];
      const categories = [...new Set(data?.map(item => item.category_name).filter(Boolean) || [])];

      return {
        rubros,
        categories,
        subcategories: [] // Construction tasks no tiene subcategorías
      };
    },
    enabled: !!supabase && !!organizationId && !!projectId
  });
}