import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './use-current-user';

export interface DesignPhase {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDesignPhaseData {
  project_id: string;
  name: string;
  description?: string;
}

export interface UpdateDesignPhaseData extends CreateDesignPhaseData {
  id: string;
}

export function useDesignPhases(projectId: string) {
  return useQuery({
    queryKey: ['design-phases', projectId],
    queryFn: async () => {
      console.log('Fetching design phases for project:', projectId);
      
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('design_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching design phases:', error);
        // Si las tablas no existen o hay error de columna, retornar array vacío
        if (error.code === '42P01' || error.code === '42703') {
          return [];
        }
        throw error;
      }

      return data as DesignPhase[];
    },
    enabled: !!projectId
  });
}

export function useCreateDesignPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phaseData: CreateDesignPhaseData) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('design_phases')
        .insert([phaseData])
        .select()
        .single();

      if (error) {
        console.error('Error creating design phase:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-phases', variables.project_id] });
    }
  });
}

export function useUpdateDesignPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateDesignPhaseData) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('design_phases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating design phase:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-phases', variables.project_id] });
    }
  });
}

export function useDeleteDesignPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('design_phases')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting design phase:', error);
        throw error;
      }

      return id;
    },
    onSuccess: (_, phaseId) => {
      // Invalidate all design phases queries
      queryClient.invalidateQueries({ queryKey: ['design-phases'] });
      // Also invalidate design tasks since they depend on phases
      queryClient.invalidateQueries({ queryKey: ['design-tasks'] });
    }
  });
}