import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface ConstructionDependency {
  id: string;
  predecessor_task_id: string;
  successor_task_id: string;
  type: string;
  lag_days?: number;
  created_at: string;
}

export interface ConstructionDependencyWithTasks extends ConstructionDependency {
  predecessor_task?: {
    id: string;
    task: {
      code: string;
      name_rendered: string;
      processed_display_name?: string;
    };
  };
  successor_task?: {
    id: string;
    task: {
      code: string;
      name_rendered: string;
      processed_display_name?: string;
    };
  };
}

export function useConstructionDependencies(projectId: string) {
  return useQuery({
    queryKey: ['construction-dependencies', projectId],
    queryFn: async (): Promise<ConstructionDependencyWithTasks[]> => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('construction_dependencies')
        .select(`
          *,
          predecessor_task:construction_tasks!predecessor_task_id (
            id,
            task:task_view!inner (
              code,
              name_rendered
            )
          ),
          successor_task:construction_tasks!successor_task_id (
            id,
            task:task_view!inner (
              code,
              name_rendered
            )
          )
        `)
        .eq('predecessor_task.project_id', projectId)
        .eq('successor_task.project_id', projectId);

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!projectId,
  });
}

export function useCreateConstructionDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dependencyData: {
      predecessor_task_id: string;
      successor_task_id: string;
      type: string;
      lag_days?: number;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('construction_dependencies')
        .insert({
          predecessor_task_id: dependencyData.predecessor_task_id,
          successor_task_id: dependencyData.successor_task_id,
          type: dependencyData.type,
          lag_days: dependencyData.lag_days || 0,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['construction-dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['construction-tasks'] });
      toast({
        title: "Dependencia creada",
        description: "La dependencia entre tareas se ha establecido correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo crear la dependencia entre tareas.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateConstructionDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updateData 
    }: {
      id: string;
      predecessor_task_id?: string;
      successor_task_id?: string;
      type?: string;
      lag_days?: number;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('construction_dependencies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['construction-tasks'] });
      toast({
        title: "Dependencia actualizada",
        description: "La dependencia entre tareas se ha actualizado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la dependencia entre tareas.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteConstructionDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('construction_dependencies')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['construction-tasks'] });
      toast({
        title: "Dependencia eliminada",
        description: "La dependencia entre tareas se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la dependencia entre tareas.",
        variant: "destructive",
      });
    },
  });
}

// Función para detectar dependencias circulares
export function detectCircularDependency(
  newPredecessorId: string,
  newSuccessorId: string,
  existingDependencies: ConstructionDependency[]
): boolean {
  // No puede depender de sí misma
  if (newPredecessorId === newSuccessorId) {
    return true;
  }

  // Crear un mapa de dependencias
  const dependencyMap = new Map<string, string[]>();
  
  // Agregar dependencias existentes
  existingDependencies.forEach(dep => {
    if (!dependencyMap.has(dep.predecessor_task_id)) {
      dependencyMap.set(dep.predecessor_task_id, []);
    }
    dependencyMap.get(dep.predecessor_task_id)!.push(dep.successor_task_id);
  });

  // Agregar la nueva dependencia propuesta
  if (!dependencyMap.has(newPredecessorId)) {
    dependencyMap.set(newPredecessorId, []);
  }
  dependencyMap.get(newPredecessorId)!.push(newSuccessorId);

  // Verificar si hay ciclo usando DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(taskId: string): boolean {
    if (recursionStack.has(taskId)) {
      return true; // Ciclo detectado
    }
    if (visited.has(taskId)) {
      return false; // Ya procesado
    }

    visited.add(taskId);
    recursionStack.add(taskId);

    const dependencies = dependencyMap.get(taskId) || [];
    for (const dep of dependencies) {
      if (hasCycle(dep)) {
        return true;
      }
    }

    recursionStack.delete(taskId);
    return false;
  }

  // Verificar desde el nuevo predecesor
  return hasCycle(newPredecessorId);
}