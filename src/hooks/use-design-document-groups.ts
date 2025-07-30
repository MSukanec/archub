import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './use-current-user';

export interface DesignDocumentGroup {
  id: string;
  name: string;
  description?: string;
  folder_id: string;
  project_id: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  document_count?: number;
  version?: number;
  folder?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export function useDesignDocumentGroups(folderId?: string) {
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;

  return useQuery({
    queryKey: ['design-document-groups', projectId, organizationId, folderId],
    queryFn: async (): Promise<DesignDocumentGroup[]> => {
      if (!projectId || !organizationId) return [];

      let query = supabase
        .from('design_document_groups')
        .select(`
          *,
          folder:design_document_folders!design_document_groups_folder_id_fkey (
            id,
            name
          ),
          creator:users!design_document_groups_created_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `);

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        console.error('Error fetching design document groups:', error);
        return [];
      }

      // Get document counts for each group
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('design_documents')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return {
            ...group,
            document_count: count || 0
          };
        })
      );

      return groupsWithCounts;
    },
    enabled: !!projectId && !!organizationId
  });
}

export function useCreateDesignDocumentGroup() {
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;

  return useMutation({
    mutationFn: async (groupData: {
      name: string;
      description?: string;
      folder_id: string;
    }): Promise<DesignDocumentGroup> => {
      if (!projectId || !organizationId || !userData?.user?.id) {
        throw new Error('Missing project, organization or user data');
      }

      const { data, error } = await supabase
        .from('design_document_groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          folder_id: groupData.folder_id,
          organization_id: organizationId,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating group: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-document-groups'] });
    }
  });
}

export function useUpdateDesignDocumentGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      description?: string;
    }): Promise<DesignDocumentGroup> => {
      const { id, ...updateData } = data;

      const { data: result, error } = await supabase
        .from('design_document_groups')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating group: ${error.message}`);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-document-groups'] });
    }
  });
}

export function useDeleteDesignDocumentGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string): Promise<void> => {
      // First, check if there are any documents in this group
      const { count } = await supabase
        .from('design_documents')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (count && count > 0) {
        throw new Error('No se puede eliminar un grupo que contiene documentos');
      }

      const { error } = await supabase
        .from('design_document_groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        throw new Error(`Error deleting group: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-document-groups'] });
    }
  });
}