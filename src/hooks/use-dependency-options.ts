import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { TaskParameterDependencyOption, InsertTaskParameterDependencyOption } from "@shared/schema";

// Hook para obtener opciones de dependencia por dependency_id
export function useDependencyOptions(dependencyId: string | null) {
  return useQuery({
    queryKey: ['dependency-options', dependencyId],
    queryFn: async () => {
      if (!dependencyId) return [];
      
      const { data, error } = await supabase!
        .from('task_parameter_dependency_options')
        .select('*')
        .eq('dependency_id', dependencyId);
      
      if (error) throw error;
      return data as TaskParameterDependencyOption[];
    },
    enabled: !!dependencyId
  });
}

// Hook para guardar opciones de dependencia (reemplaza las existentes)
export function useSaveDependencyOptions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      dependencyId, 
      childOptionIds 
    }: { 
      dependencyId: string; 
      childOptionIds: string[] 
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Primero eliminar opciones existentes para esta dependencia
      const { error: deleteError } = await supabase
        .from('task_parameter_dependency_options')
        .delete()
        .eq('dependency_id', dependencyId);
      
      if (deleteError) throw deleteError;
      
      // Luego insertar las nuevas opciones
      if (childOptionIds.length > 0) {
        const insertData = childOptionIds.map(childOptionId => ({
          dependency_id: dependencyId,
          child_option_id: childOptionId
        }));
        
        const { error: insertError } = await supabase
          .from('task_parameter_dependency_options')
          .insert(insertData);
        
        if (insertError) throw insertError;
      }
      
      return { dependencyId, childOptionIds };
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ['dependency-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      
      toast({
        title: "Visibilidad configurada",
        description: "La configuración de visibilidad se ha guardado correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error saving dependency options:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de visibilidad.",
        variant: "destructive",
      });
    },
  });
}

// Hook para obtener dependencias donde un parámetro es hijo
export function useParameterAsChild(parameterId: string | null) {
  return useQuery({
    queryKey: ['parameter-as-child', parameterId],
    queryFn: async () => {
      if (!parameterId) return [];
      
      const { data, error } = await supabase!
        .from('task_parameter_dependencies')
        .select(`
          *,
          parent_parameter:task_parameters!parent_parameter_id(*),
          parent_option:task_parameter_options!parent_option_id(*)
        `)
        .eq('child_parameter_id', parameterId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!parameterId
  });
}

// Hook para obtener opciones configuradas para una dependencia específica
export function useConfiguredOptionsForDependency(dependencyId: string | null) {
  return useQuery({
    queryKey: ['configured-options', dependencyId],
    queryFn: async () => {
      if (!dependencyId) return [];
      
      const { data, error } = await supabase!
        .from('task_parameter_dependency_options')
        .select(`
          *,
          child_option:task_parameter_options(*)
        `)
        .eq('dependency_id', dependencyId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!dependencyId
  });
}