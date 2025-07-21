import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ConstructionPhase {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  is_system: boolean;
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
      organization_id: string;
      is_system: boolean;
    }) => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data: result, error } = await supabase
        .from("construction_phases")
        .insert({
          name: data.name,
          description: data.description,
          organization_id: data.organization_id,
          is_system: data.is_system,
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
      if (data.start_date && data.start_date.trim() !== '' && data.duration_in_days && data.duration_in_days > 0 && (!data.end_date || data.end_date.trim() === '')) {
        const startDate = new Date(data.start_date);
        startDate.setDate(startDate.getDate() + data.duration_in_days);
        endDate = startDate.toISOString().split('T')[0];
      }

      const insertData: any = {
        project_id: data.project_id,
        phase_id: data.phase_id,
        position: nextPosition,
        created_by: data.created_by,
      };

      // Solo agregar campos de fecha si tienen valores válidos
      if (data.start_date && data.start_date.trim() !== '') {
        insertData.start_date = data.start_date;
      }
      if (data.duration_in_days && data.duration_in_days > 0) {
        insertData.duration_in_days = data.duration_in_days;
      }
      if (endDate && endDate.trim() !== '') {
        insertData.end_date = endDate;
      }

      const { data: result, error } = await supabase
        .from("construction_project_phases")
        .insert(insertData)
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

// Hook para actualizar fechas automáticamente de las fases basándose en sus tareas
export function useUpdatePhasesDates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      projectId: string;
      organizationId: string;
    }) => {
      if (!supabase) throw new Error("Supabase not initialized");

      console.log('Actualizando fechas automáticas de fases...');

      // 1. Obtener todas las fases del proyecto
      const { data: projectPhases, error: phasesError } = await supabase
        .from("construction_project_phases")
        .select(`
          id,
          project_id,
          phase_id,
          phase:construction_phases!inner (name)
        `)
        .eq("project_id", data.projectId);

      if (phasesError) throw phasesError;

      // 2. Obtener todas las tareas del proyecto con sus fechas
      const { data: tasks, error: tasksError } = await supabase
        .from("construction_gantt_view")
        .select("task_instance_id, start_date, end_date, duration_in_days, phase_name")
        .eq("project_id", data.projectId);

      if (tasksError) throw tasksError;

      // 3. Calcular fechas para cada fase
      const phaseUpdates = [];
      
      for (const projectPhase of projectPhases || []) {
        // Filtrar tareas de esta fase  
        const tasksInPhase = (tasks || []).filter(task => 
          task.phase_name === (projectPhase.phase as any)?.name
        );

        if (tasksInPhase.length > 0) {
          // Encontrar fecha de inicio más temprana
          const taskStartDates = tasksInPhase
            .map(task => task.start_date)
            .filter(date => date !== null && date !== undefined)
            .sort();

          // Encontrar fecha de fin más tardía
          const taskEndDates = tasksInPhase
            .map(task => {
              if (task.end_date) {
                return task.end_date;
              } else if (task.start_date && task.duration_in_days) {
                const startDate = new Date(task.start_date);
                startDate.setDate(startDate.getDate() + task.duration_in_days - 1);
                return startDate.toISOString().split('T')[0];
              }
              return null;
            })
            .filter(date => date !== null)
            .sort().reverse();

          if (taskStartDates.length > 0 && taskEndDates.length > 0) {
            const phaseStartDate = taskStartDates[0];
            const phaseEndDate = taskEndDates[0];

            phaseUpdates.push({
              id: projectPhase.id,
              start_date: phaseStartDate,
              end_date: phaseEndDate
            });
          }
        }
      }

      // 4. Actualizar fechas en la base de datos
      for (const update of phaseUpdates) {
        const { error: updateError } = await supabase
          .from("construction_project_phases")
          .update({
            start_date: update.start_date,
            end_date: update.end_date,
            duration_in_days: update.duration_in_days,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);

        if (updateError) {
          console.error('Error actualizando fase:', updateError);
          throw updateError;
        }
      }

      console.log(`Actualizadas ${phaseUpdates.length} fases automáticamente`);
      return phaseUpdates;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ["project-phases", variables.projectId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["construction-tasks", variables.projectId, variables.organizationId] 
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