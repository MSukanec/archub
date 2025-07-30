import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DesignPhase {
  id: string;
  name: string;
  organization_id: string | null;
  created_at: string;
}

export function useDesignPhases(organizationId?: string) {
  return useQuery({
    queryKey: ['designPhases', organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const { data, error } = await supabase
        .from('design_phases')
        .select('*')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching design phases:', error);
        throw error;
      }

      return data as DesignPhase[];
    },
    enabled: !!organizationId,
  });
}

export function useDesignProjectPhases(projectId: string) {
  return useQuery({
    queryKey: ['designProjectPhases', projectId],
    queryFn: async () => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const { data, error } = await supabase
        .from('design_project_phases')
        .select(`
          *,
          design_phases (
            id,
            name
          )
        `)
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching design project phases:', error);
        throw error;
      }

      return data;
    },
    enabled: !!projectId,
  });
}



export function useCreateDesignProjectPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      project_id: string;
      organization_id: string;
      design_phase_id: string;
      start_date?: string;
      end_date?: string;
      position: number;
    }) => {
      const { data: result, error } = await supabase
        .from('design_project_phases')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating design project phase:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['designProjectPhases', variables.project_id] });
    },
  });
}