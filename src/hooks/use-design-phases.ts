import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from './use-current-user';

export interface DesignPhase {
  id: string;
  name: string;
  created_at: string;
}

export interface DesignProjectPhase {
  id: string;
  organization_id: string;
  project_id: string;
  design_phase_id: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  design_phases: DesignPhase;
}

export interface DesignPhaseTask {
  id: string;
  project_phase_id: string;
  name: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  assigned_to?: string | null;
  status: string;
  priority: string;
  position: number;
  is_active: boolean;
  is_completed: boolean;
  completed_at?: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateDesignProjectPhaseData {
  organization_id: string;
  project_id: string;
  design_phase_id: string;
  start_date?: string | null;
  end_date?: string | null;
}

export function useDesignPhases() {
  return useQuery({
    queryKey: ['design-phases'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('Fetching design phases for organization:');
      
      const { data, error } = await supabase
        .from('design_phases')
        .select('*')
        .order('created_at');
      
      if (error) {
        console.error('Error fetching design phases:', error);
        throw error;
      }
      
      return data as DesignPhase[];
    },
    enabled: !!supabase,
  });
}

export function useDesignProjectPhases(projectId: string) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  return useQuery({
    queryKey: ['design-project-phases', projectId, organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('Fetching design tasks for project:', organizationId);
      
      const { data, error } = await supabase
        .from('design_project_phases')
        .select(`
          *,
          design_phases (*)
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('position');
      
      if (error) {
        console.error('Error fetching design tasks:', error);
        throw error;
      }
      
      return data as DesignProjectPhase[];
    },
    enabled: !!projectId && !!organizationId && !!supabase,
  });
}

export function useCreateDesignProjectPhase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (phaseData: CreateDesignProjectPhaseData) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('design_project_phases')
        .insert([phaseData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['design-project-phases', data.project_id] 
      });
      toast({
        title: "Fase agregada",
        description: "La fase de diseño se agregó correctamente al cronograma.",
      });
    },
    onError: (error) => {
      console.error('Error creating design project phase:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la fase de diseño.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDesignProjectPhasePosition() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      position, 
      projectId 
    }: { 
      id: string; 
      position: number; 
      projectId: string; 
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('design_project_phases')
        .update({ position })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['design-project-phases', data.project_id] 
      });
    },
    onError: (error) => {
      console.error('Error updating phase position:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la posición de la fase.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDesignProjectPhase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('design_project_phases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['design-project-phases', data.projectId] 
      });
      toast({
        title: "Fase eliminada",
        description: "La fase de diseño se eliminó correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error deleting design project phase:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la fase de diseño.",
        variant: "destructive",
      });
    },
  });
}
export function useDesignPhaseTasks(projectId: string) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  return useQuery({
    queryKey: ['design-phase-tasks', projectId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('Fetching design tasks for project:', projectId);
      
      const { data, error } = await supabase
        .from('design_phase_tasks')
        .select(`
          *,
          design_project_phases!inner(
            project_id
          )
        `)
        .eq('design_project_phases.project_id', projectId)
        .eq('is_active', true)
        .order('position');
      
      if (error) {
        console.error('Error fetching design tasks:', error);
        throw error;
      }
      
      return data as DesignPhaseTask[];
    },
    enabled: !!projectId && !!organizationId && !!supabase,
  });
}

// Hook combinado que devuelve fases con sus tareas para el Gantt
export function useGanttPhasesWithTasks(projectId: string) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  return useQuery({
    queryKey: ['gantt-phases-tasks', projectId, organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Obtener fases del proyecto
      const { data: phases, error: phasesError } = await supabase
        .from('design_project_phases')
        .select(`
          *,
          design_phases (*)
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('position');
      
      if (phasesError) {
        console.error('Error fetching design project phases:', phasesError);
        throw phasesError;
      }

      // Obtener todas las tareas para estas fases
      const phaseIds = phases.map(phase => phase.id);
      if (phaseIds.length === 0) return [];

      const { data: tasks, error: tasksError } = await supabase
        .from('design_phase_tasks')
        .select('*')
        .in('project_phase_id', phaseIds)
        .eq('is_active', true)
        .order('position');
      
      if (tasksError) {
        console.error('Error fetching design phase tasks:', tasksError);
        throw tasksError;
      }

      // Combinar fases con sus tareas
      const phasesWithTasks = phases.map(phase => ({
        ...phase,
        tasks: tasks.filter(task => task.project_phase_id === phase.id)
      }));

      return phasesWithTasks;
    },
    enabled: !!projectId && !!organizationId && !!supabase,
  });
}

// Toggle completed status for design phase task
export function useToggleDesignPhaseTaskCompleted() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      taskId, 
      isCompleted, 
      projectId 
    }: { 
      taskId: string; 
      isCompleted: boolean;
      projectId: string;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const updateData: { is_completed: boolean; completed_at?: string | null } = {
        is_completed: isCompleted,
      }
      
      if (isCompleted) {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }

      const { data, error } = await supabase
        .from('design_phase_tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gantt-phases-tasks', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['design-phase-tasks', variables.projectId] })
      toast({ 
        title: variables.isCompleted ? "Tarea completada" : "Tarea reactivada"
      })
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar tarea",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}