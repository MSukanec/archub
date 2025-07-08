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
    console.error("Error fetching parameter values:", error);
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
      let replacement = paramValue.task_parameters?.expression_template || paramValue.label;
      
      // Si el replacement contiene {value}, reemplazarlo con el label
      if (replacement.includes('{value}')) {
        replacement = replacement.replace(/{value}/g, paramValue.label);
      }
      
      processed = processed.replace(new RegExp(placeholder, 'g'), replacement);
      
      // También reemplazar las ocurrencias directas del paramValueId con el replacement
      processed = processed.replace(new RegExp(paramValueId, 'g'), replacement);
    }
  });
  
  return processed;
}

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

      // Obtener todas las tareas (SIN filtrar por organización para mostrar todas las tareas disponibles)
      const { data: allTasks, error } = await supabase
        .from("task_generated_view")
        .select("*")
        .limit(100);

      if (error) {
        console.error("Error searching tasks:", error);
        throw error;
      }
      
      // Procesar los display_name para reemplazar placeholders
      const processedData = await Promise.all(
        allTasks?.map(async task => ({
          ...task,
          display_name: await processDisplayName(task.display_name, task.param_values)
        })) || []
      );

      // Ahora filtrar por término de búsqueda en el display_name procesado
      const filteredData = processedData.filter(task => 
        task.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filteredData;
    },
    enabled: enabled && !!supabase && !!organizationId && searchTerm.length >= 3
  });
}