import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Función para procesar el display_name y reemplazar placeholders
async function processDisplayName(displayName: string, paramValues: any): Promise<string> {
  if (!displayName || !paramValues || !supabase) return displayName;
  
  let processed = displayName;
  
  // Obtener los valores reales de los parámetros
  const paramValueIds = Object.values(paramValues);
  if (paramValueIds.length === 0) return displayName;
  

  
  const { data: parameterValues, error } = await supabase
    .from('task_parameter_values')
    .select(`
      name, 
      label,
      parameter_id,
      task_parameters!inner(expression_template)
    `)
    .in('name', paramValueIds);
  
  if (error) {
    return displayName;
  }
  

  
  // Reemplazar placeholders usando expression_template o label
  Object.keys(paramValues).forEach(key => {
    const placeholder = `{{${key}}}`;
    const paramValueId = paramValues[key];
    
    // Buscar el valor correspondiente
    const paramValue = parameterValues?.find(pv => pv.name === paramValueId);
    
    if (paramValue) {
      // Usar expression_template si existe, sino usar label
      let replacement = (paramValue.task_parameters as any)?.expression_template || paramValue.label;
      
      // Si el replacement contiene {value}, reemplazarlo con el label
      if (replacement.includes('{value}')) {
        replacement = replacement.replace(/{value}/g, paramValue.label);
      }
      
      processed = processed.replace(new RegExp(placeholder, 'g'), replacement);
      
      // También reemplazar las ocurrencias directas del paramValueId con el replacement
      processed = processed.replace(new RegExp(paramValueId, 'g'), replacement);
    }
  });
  
  // Clean up multiple spaces and trim the final result
  return processed.replace(/\s+/g, ' ').trim();
}

export interface TaskSearchResult {
  id: string;
  code: string;
  display_name: string;
  template_id: string;
  param_values: any;
  is_public: boolean;
  organization_id: string;
  is_system?: boolean;
  rubro_name?: string;
  category_name?: string;
  subcategory_name?: string;
  units?: {
    name: string;
  };
}

export interface TaskSearchFilters {
  origin: 'all' | 'system' | 'organization'; // Todo, Sistema, Mi Organización
  rubro?: string;
  category?: string;
  subcategory?: string;
}

export function useTaskSearch(
  searchTerm: string, 
  organizationId: string, 
  filters: TaskSearchFilters = { origin: 'all' },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["task-search", searchTerm, organizationId, filters],
    queryFn: async (): Promise<TaskSearchResult[]> => {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      if (!searchTerm || searchTerm.length < 3) {
        return [];
      }

      // Construir query con filtros
      let query = supabase
        .from("task_view")
        .select(`
          *,
          units!inner(
            name
          )
        `)
        .limit(100);

      // Filtrar por origen (Sistema/Organización)
      if (filters.origin === 'system') {
        query = query.eq('is_system', true);
      } else if (filters.origin === 'organization') {
        query = query.eq('organization_id', organizationId);
      }
      // Si es 'all', no aplicar filtros adicionales

      // Filtrar por rubro si se especifica
      if (filters.rubro) {
        query = query.eq('rubro_name', filters.rubro);
      }

      // Filtrar por categoría si se especifica
      if (filters.category) {
        query = query.eq('category_name', filters.category);
      }

      // Filtrar por subcategoría si se especifica
      if (filters.subcategory) {
        query = query.eq('subcategory_name', filters.subcategory);
      }

      const { data: allTasks, error } = await query;

      if (error) {
        throw error;
      }
      
      // Procesar los display_name para reemplazar placeholders
      const processedData = await Promise.all(
        allTasks?.map(async task => ({
          ...task,
          display_name: await processDisplayName(task.display_name, task.param_values)
        })) || []
      );

      // Filtrar por término de búsqueda en el display_name procesado
      const filteredData = processedData.filter(task => 
        task.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filteredData;
    },
    enabled: enabled && !!supabase && !!organizationId && searchTerm.length >= 3
  });
}

// Hook para obtener opciones de filtros
export function useTaskSearchFilterOptions(organizationId: string) {
  return useQuery({
    queryKey: ["task-search-filter-options", organizationId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Obtener todos los valores únicos para los filtros
      const { data: filterData, error } = await supabase
        .from("task_view")
        .select("rubro_name, category_name, subcategory_name")
        .limit(1000);

      if (error) {
        throw error;
      }

      // Extraer valores únicos
      const rubros = Array.from(new Set(filterData?.map(item => item.rubro_name).filter(Boolean))).sort();
      const categories = Array.from(new Set(filterData?.map(item => item.category_name).filter(Boolean))).sort();
      const subcategories = Array.from(new Set(filterData?.map(item => item.subcategory_name).filter(Boolean))).sort();

      return {
        rubros,
        categories,
        subcategories
      };
    },
    enabled: !!supabase && !!organizationId
  });
}