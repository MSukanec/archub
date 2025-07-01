import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DesignProjectPhase, InsertDesignProjectPhase } from '../../shared/schema';

export interface DesignProjectPhaseWithPhase extends DesignProjectPhase {
  design_phase: {
    id: string;
    name: string;
    description: string | null;
  };
}

export function useDesignProjectPhases(projectId: string) {
  return useQuery({
    queryKey: ['design-project-phases', projectId],
    queryFn: async (): Promise<DesignProjectPhaseWithPhase[]> => {
      console.log('Fetching design project phases for project:', projectId);
      
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('design_project_phases')
        .select(`
          *,
          design_phase:design_phases(
            id,
            name,
            description
          )
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching design project phases:', error);
        throw error;
      }

      return data as DesignProjectPhaseWithPhase[];
    },
    enabled: !!projectId
  });
}

export function useCreateDesignProjectPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phaseData: InsertDesignProjectPhase) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('design_project_phases')
        .insert([{
          ...phaseData,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating design project phase:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design-project-phases'] });
    },
  });
}

export function useUpdateDesignProjectPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: InsertDesignProjectPhase & { id: string }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('design_project_phases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating design project phase:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-project-phases'] });
    },
  });
}

export function useDeleteDesignProjectPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('design_project_phases')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error deleting design project phase:', error);
        throw error;
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-project-phases'] });
    },
  });
}