import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './use-current-user';
import { toast } from '@/hooks/use-toast';

// Project basic info interface
export interface ProjectInfo {
  id: string;
  name: string;
  organization_id: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Project data interface (extended information)
export interface ProjectData {
  project_id: string;
  surface_total?: number;
  surface_covered?: number;
  surface_semi?: number;
  start_date?: string;
  estimated_end?: string;
  project_type_id?: string;
  hero_image_url?: string;
  lat?: number;
  lng?: number;
  zip_code?: string;
  description?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  country?: string;
  state?: string;
  address?: string;
  city?: string;
  client_name?: string;
  contact_phone?: string;
  email?: string;
  modality_id?: string;
}

// Hook to get current project info
export function useCurrentProjectInfo() {
  const { data: userData } = useCurrentUser();
  const currentProjectId = userData?.preferences?.last_project_id;

  return useQuery({
    queryKey: ['current-project-info', currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) {
        throw new Error('No current project selected');
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', currentProjectId)
        .single();

      if (error) {
        throw error;
      }

      return data as ProjectInfo;
    },
    enabled: !!currentProjectId,
  });
}

// Hook to get current project data (extended info)
export function useCurrentProjectData() {
  const { data: userData } = useCurrentUser();
  const currentProjectId = userData?.preferences?.last_project_id;

  return useQuery({
    queryKey: ['current-project-data', currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) {
        throw new Error('No current project selected');
      }

      const { data, error } = await supabase
        .from('project_data')
        .select('*')
        .eq('project_id', currentProjectId)
        .single();

      if (error) {
        // If no project_data exists yet, return null instead of throwing
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as ProjectData;
    },
    enabled: !!currentProjectId,
  });
}

// Hook to update project name
export function useUpdateProjectName() {
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const currentProjectId = userData?.preferences?.last_project_id;

  return useMutation({
    mutationFn: async (name: string) => {
      if (!currentProjectId) {
        throw new Error('No current project selected');
      }

      const { data, error } = await supabase
        .from('projects')
        .update({ 
          name,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentProjectId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-project-info'] });
      toast({
        title: 'Proyecto actualizado',
        description: 'El nombre del proyecto se ha actualizado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el nombre del proyecto.',
        variant: 'destructive',
      });
    },
  });
}

// Hook to update or create project data
export function useUpdateProjectData() {
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const currentProjectId = userData?.preferences?.last_project_id;

  return useMutation({
    mutationFn: async (projectData: Partial<ProjectData>) => {
      if (!currentProjectId) {
        throw new Error('No current project selected');
      }

      // First check if project_data exists using maybeSingle to avoid errors
      const { data: existingData, error: checkError } = await supabase
        .from('project_data')
        .select('project_id')
        .eq('project_id', currentProjectId)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingData) {
        // Update existing record
        const { data, error } = await supabase
          .from('project_data')
          .update({
            ...projectData,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', currentProjectId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data;
      } else {
        // Create new record - use upsert to handle race conditions
        const { data, error } = await supabase
          .from('project_data')
          .upsert({
            project_id: currentProjectId,
            ...projectData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'project_id'
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-project-data'] });
      toast({
        title: 'Datos actualizados',
        description: 'Los datos del proyecto se han actualizado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron actualizar los datos del proyecto.',
        variant: 'destructive',
      });
    },
  });
}