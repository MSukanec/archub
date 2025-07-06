import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ProjectType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface ProjectModality {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

// Hook to get project types
export function useProjectTypes() {
  return useQuery({
    queryKey: ['project-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_types')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return data as ProjectType[];
    },
  });
}

// Hook to get project modalities
export function useProjectModalities() {
  return useQuery({
    queryKey: ['project-modalities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_modalities')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return data as ProjectModality[];
    },
  });
}