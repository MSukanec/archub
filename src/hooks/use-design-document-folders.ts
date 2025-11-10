import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './use-current-user';

export interface DesignDocumentFolder {
  id: string;
  name: string;
  project_id: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  parent_id?: string;
}

export function useDesignDocumentFolders() {
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;

  return useQuery({
    queryKey: ['design-document-folders', projectId, organizationId],
    queryFn: async (): Promise<DesignDocumentFolder[]> => {
      if (!projectId || !organizationId) return [];

      const { data, error } = await supabase
        .from('document_folders')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) {
        return [];
      }

      return data || [];
    },
    enabled: !!projectId && !!organizationId
  });
}

export function useCreateDesignDocumentFolder() {
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;
  const userId = userData?.user?.id;

  return useMutation({
    mutationFn: async (folderData: { name: string; parent_id?: string }): Promise<DesignDocumentFolder> => {
      if (!projectId || !organizationId || !userId) {
        throw new Error('Missing project, organization, or user data');
      }

      // First, get the organization member ID for the current user
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (memberError || !memberData) {
        throw new Error('Could not find organization membership');
      }

      const { data, error } = await supabase
        .from('document_folders')
        .insert({
          name: folderData.name,
          project_id: projectId,
          organization_id: organizationId,
          created_by: memberData.id, // Use organization member ID
          parent_id: folderData.parent_id || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating folder: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-document-folders'] });
    }
  });
}

export function useUpdateDesignDocumentFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderData: { id: string; name: string }): Promise<DesignDocumentFolder> => {
      const { data, error } = await supabase
        .from('document_folders')
        .update({
          name: folderData.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', folderData.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating folder: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-document-folders'] });
    }
  });
}

export function useDeleteDesignDocumentFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderId: string): Promise<void> => {
      const { error } = await supabase
        .from('document_folders')
        .delete()
        .eq('id', folderId);

      if (error) {
        throw new Error(`Error deleting folder: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-document-folders'] });
      queryClient.invalidateQueries({ queryKey: ['design-document-groups'] });
    }
  });
}