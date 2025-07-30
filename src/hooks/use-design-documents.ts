import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './use-current-user';

export interface DesignDocument {
  id: string;
  name: string;
  file_name: string;
  description?: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  version_number: number;
  project_id: string;
  organization_id: string;
  group_id: string;
  status: string;
  visibility?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  creator?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  group?: {
    id: string;
    name: string;
    folder_id: string;
  };
}

export function useDesignDocuments(groupId?: string) {
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;

  return useQuery({
    queryKey: ['design-documents', projectId, organizationId, groupId],
    queryFn: async (): Promise<DesignDocument[]> => {
      if (!projectId || !organizationId) return [];

      let query = supabase
        .from('design_documents')
        .select(`
          *,
          creator:users!design_documents_created_by_fkey (
            id,
            full_name,
            avatar_url
          ),
          group:design_document_groups!design_documents_group_id_fkey (
            id,
            name,
            folder_id
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId);

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    },
    enabled: !!projectId && !!organizationId
  });
}

export function useCreateDesignDocument() {
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;

  return useMutation({
    mutationFn: async (documentData: {
      name: string;
      file_name: string;
      description?: string;
      file_path: string;
      file_url: string;
      file_type: string;
      file_size?: number;
      group_id: string;
      status: string;
      visibility?: string;
    }): Promise<DesignDocument> => {
      if (!projectId || !organizationId || !userData?.user?.id) {
        throw new Error('Missing project, organization or user data');
      }

      const { data, error } = await supabase
        .from('design_documents')
        .insert({
          ...documentData,
          project_id: projectId,
          organization_id: organizationId,
          created_by: userData.user.id,
          version_number: 1,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating document: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-documents'] });
      queryClient.invalidateQueries({ queryKey: ['design-document-groups'] });
    }
  });
}

export function useUpdateDesignDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      description?: string;
      status?: string;
      visibility?: string;
    }): Promise<DesignDocument> => {
      const { id, ...updateData } = data;

      const { data: result, error } = await supabase
        .from('design_documents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating document: ${error.message}`);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-documents'] });
    }
  });
}

export function useDeleteDesignDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string): Promise<void> => {
      const { error } = await supabase
        .from('design_documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        throw new Error(`Error deleting document: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-documents'] });
      queryClient.invalidateQueries({ queryKey: ['design-document-groups'] });
    }
  });
}