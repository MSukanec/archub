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
        .from('design_document_folders')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching design document folders:', error);
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

  return useMutation({
    mutationFn: async (folderName: string): Promise<DesignDocumentFolder> => {
      if (!projectId || !organizationId || !userData?.user?.id) {
        throw new Error('Missing project, organization or user data');
      }

      const { data, error } = await supabase
        .from('design_document_folders')
        .insert({
          name: folderName,
          project_id: projectId,
          organization_id: organizationId,
          created_by: userData.user.id,
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