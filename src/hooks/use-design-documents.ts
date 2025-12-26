import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './use-current-user';

export interface DesignDocument {
  id: string;
  name?: string;
  file_name: string;
  description?: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  project_id: string;
  organization_id: string;
  folder_id: string | null;
  status: string;
  created_by: string;
  created_at: string;
  creator?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export function useDesignDocuments(folderId?: string) {
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;

  return useQuery({
    queryKey: ['design-documents', projectId, organizationId, folderId],
    queryFn: async (): Promise<DesignDocument[]> => {
      if (!projectId || !organizationId) return [];

      let query = supabase
        .from('documents')
        .select(`
          *,
          creator:organization_members (
            id,
            user:users (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId);

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching design documents:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!projectId && !!organizationId
  });
}

// New hook for fetching documents by folder (including those without groups)
export function useDesignDocumentsByFolder(folderId?: string) {
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;

  return useQuery({
    queryKey: ['design-documents-folder', projectId, organizationId, folderId],
    queryFn: async (): Promise<DesignDocument[]> => {
      if (!projectId || !organizationId || !folderId) return [];

      // Get documents directly assigned to folder (folder_id matches)
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          creator:organization_members (
            id,
            user:users (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      console.log('useDesignDocumentsByFolder Query Result:', {
        folderId,
        projectId,
        organizationId,
        data: data,
        error: error,
        query: 'documents with folder_id OR group.folder_id filter'
      });

      if (error) {
        console.error('Error fetching folder documents:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!projectId && !!organizationId && !!folderId
  });
}

export function useCreateDesignDocument() {
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;
  const userId = userData?.user?.id;

  return useMutation({
    mutationFn: async (documentData: {
      name: string;
      file_name: string;
      description?: string;
      file_path: string;
      file_url: string;
      file_type: string;
      file_size?: number;
      folder_id: string;
      status: string;
    }): Promise<DesignDocument> => {
      if (!projectId || !organizationId || !userId) {
        throw new Error('Missing project, organization or user data');
      }

      // Get the organization member ID for the current user
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
        .from('documents')
        .insert({
          ...documentData,
          project_id: projectId,
          organization_id: organizationId,
          created_by: memberData.id, // Use organization member ID
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
      queryClient.invalidateQueries({ queryKey: ['design-documents-folder'] });
      queryClient.invalidateQueries({ queryKey: ['design-document-groups'] });
      queryClient.invalidateQueries({ queryKey: ['design-document-folders'] });
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
        .from('documents')
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
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        throw new Error(`Error deleting document: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-documents'] });
      queryClient.invalidateQueries({ queryKey: ['design-documents-folder'] });
      queryClient.invalidateQueries({ queryKey: ['design-document-groups'] });
      queryClient.invalidateQueries({ queryKey: ['design-document-folders'] });
    }
  });
}