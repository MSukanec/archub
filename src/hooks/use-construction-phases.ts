import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ConstructionPhase {
  id: string;
  name: string;
  description?: string;
  default_duration?: number;
  organization_id: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConstructionProjectPhase {
  id: string;
  project_id: string;
  phase_id: string;
  start_date?: string;
  duration_in_days?: number;
  end_date?: string;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  phase: ConstructionPhase;
}

// Hook para obtener todas las fases de una organización
export function useConstructionPhases(organizationId: string) {
  return useQuery({
    queryKey: ["construction-phases", organizationId],
    queryFn: async (): Promise<ConstructionPhase[]> => {
      if (!supabase || !organizationId) {
        throw new Error("Supabase client not initialized or missing organizationId");
      }

      const { data, error } = await supabase
        .from("construction_phases")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name");

      if (error) {
        console.error("Error fetching construction phases:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!organizationId,
  });
}

// Hook para obtener las fases de un proyecto específico
export function useProjectPhases(projectId: string) {
  return useQuery({
    queryKey: ["project-phases", projectId],
    queryFn: async (): Promise<ConstructionProjectPhase[]> => {
      if (!supabase || !projectId) {
        throw new Error("Supabase client not initialized or missing projectId");
      }

      const { data, error } = await supabase
        .from("construction_project_phases")
        .select(`
          *,
          phase:construction_phases!inner (*)
        `)
        .eq("project_id", projectId)
        .order("position");

      if (error) {
        console.error("Error fetching project phases:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!projectId,
  });
}

// Hook para crear una nueva fase de construcción
export function useCreateConstructionPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      default_duration?: number;
      organization_id: string;
      is_default?: boolean;
    }) => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data: result, error } = await supabase
        .from("construction_phases")
        .insert({
          name: data.name,
          description: data.description,
          default_duration: data.default_duration,
          organization_id: data.organization_id,
          is_default: data.is_default || false,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating construction phase:", error);
        throw error;
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["construction-phases", data.organization_id] 
      });
    },
  });
}

// Hook para agregar una fase a un proyecto
export function useCreateProjectPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      project_id: string;
      phase_id: string;
      start_date?: string;
      duration_in_days?: number;
      end_date?: string;
      created_by: string;
    }) => {
      if (!supabase) throw new Error("Supabase not initialized");

      // Get the next position for this project
      const { data: existingPhases, error: positionError } = await supabase
        .from("construction_project_phases")
        .select("position")
        .eq("project_id", data.project_id)
        .order("position", { ascending: false })
        .limit(1);

      if (positionError) {
        console.error("Error getting position:", positionError);
        throw positionError;
      }

      const nextPosition = existingPhases?.length > 0 ? (existingPhases[0].position + 1) : 1;

      // Calculate end_date if start_date and duration_in_days are provided
      let endDate = data.end_date;
      if (data.start_date && data.duration_in_days && !data.end_date) {
        const startDate = new Date(data.start_date);
        startDate.setDate(startDate.getDate() + data.duration_in_days);
        endDate = startDate.toISOString().split('T')[0];
      }

      const { data: result, error } = await supabase
        .from("construction_project_phases")
        .insert({
          project_id: data.project_id,
          phase_id: data.phase_id,
          start_date: data.start_date,
          duration_in_days: data.duration_in_days,
          end_date: endDate,
          position: nextPosition,
          created_by: data.created_by,
        })
        .select(`
          *,
          phase:construction_phases!inner (*)
        `)
        .single();

      if (error) {
        console.error("Error creating project phase:", error);
        throw error;
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["project-phases", data.project_id] 
      });
    },
  });
}

// Hook para eliminar una fase de proyecto
export function useDeleteProjectPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      project_id: string;
    }) => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { error } = await supabase
        .from("construction_project_phases")
        .delete()
        .eq("id", data.id);

      if (error) {
        console.error("Error deleting project phase:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["project-phases", data.project_id] 
      });
    },
  });
}