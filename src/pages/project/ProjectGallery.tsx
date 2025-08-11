import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/desktop/Layout';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Button } from '@/components/ui/button';
import { Gallery } from '@/components/ui-custom/Gallery';
import { useToast } from '@/hooks/use-toast';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { ActionBar } from '@/components/layout/desktop/ActionBar';
import { Images, Plus } from 'lucide-react';

// Gallery file interface
interface GalleryFile {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  created_at: string;
  description?: string;
  project_id?: string;
  project_name?: string;
  visibility: 'organization' | 'project';
}

export default function ProjectGallery() {
  const { data: userData } = useCurrentUser();
  const storedProjectId = userData?.preferences?.last_project_id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useGlobalModalStore();
  const { setSidebarContext } = useNavigationStore();
  const [location] = useLocation();

  // Set sidebar context based on current route
  useEffect(() => {
    if (location.includes('/project/')) {
      setSidebarContext('project');
    } else if (location.includes('/construction/')) {
      setSidebarContext('construction');
    }
  }, [location, setSidebarContext]);

  // Query to check if stored project belongs to current organization
  const { data: currentProject } = useQuery({
    queryKey: ['currentProject', storedProjectId, userData?.organization?.id],
    queryFn: async () => {
      if (!storedProjectId || !userData?.organization?.id || !supabase) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, organization_id')
        .eq('id', storedProjectId)
        .eq('organization_id', userData.organization.id)
        .single();
      
      if (error) {
        console.log('Project not found in current organization:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!storedProjectId && !!userData?.organization?.id
  });

  // Use project ID only if the project belongs to current organization
  const projectId = currentProject?.id || null;

  // Gallery files query
  const { data: galleryFiles = [], isLoading, error } = useQuery({
    queryKey: ['galleryFiles', projectId, userData?.organization?.id],
    queryFn: async () => {
      console.log('Fetching gallery files for project:', projectId);
      console.log('Organization ID:', userData?.organization?.id);
      
      if (!supabase || !userData?.organization?.id) {
        throw new Error('Missing required data');
      }

      let query = supabase
        .from('project_media')
        .select(`
          id,
          file_url,
          file_type,
          file_name,
          created_at,
          site_log_id,
          description,
          project_id,
          organization_id,
          file_size,
          visibility,
          created_by,
          projects (
            name
          )
        `)
        .eq('organization_id', userData.organization.id);

      // Filter by project if we have a specific project ID
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gallery files:', error);
        throw error;
      }

      return data?.map((file: any) => {
        // Generate proper public URL from Supabase Storage
        const publicUrl = file.file_url?.startsWith('http') 
          ? file.file_url 
          : file.file_url 
            ? supabase.storage.from('project-media').getPublicUrl(file.file_url).data.publicUrl
            : '';

        return {
          id: file.id,
          file_url: publicUrl,
          file_type: file.file_type,
          file_name: file.file_name || 'Sin nombre',
          original_name: file.file_name || 'Sin nombre',
          title: file.file_name || 'Sin título',
          description: file.description || '',
          entry_type: 'registro_general',
          created_at: file.created_at,
          project_id: file.project_id,
          project_name: file.projects?.name || 'Proyecto sin nombre',
          file_size: file.file_size,
          visibility: file.visibility as 'organization' | 'project',
          created_by: file.created_by,
          site_log_id: file.site_log_id
        };
      }) || [];
    },
    enabled: !!userData?.preferences?.last_organization_id
  });

  // Delete mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get file info first
      const { data: fileData, error: fetchError } = await supabase
        .from('project_media')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([fileData.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_media')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Archivo eliminado correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['galleryFiles'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el archivo',
        variant: 'destructive',
      });
      console.error('Delete error:', error);
    },
  });

  // File handlers
  const handleEdit = (file: GalleryFile) => {
    openModal('gallery', { fileId: file.id });
  };

  const handleDownload = (file: GalleryFile) => {
    if (file.file_url) {
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = (file: GalleryFile) => {
    deleteFileMutation.mutate(file.id);
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout
        headerProps={{
          icon: Images,
          title: "Galería",
          actionButton: {
            label: 'Subir Archivo',
            icon: Plus,
            onClick: () => openModal('gallery')
          }
        }}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando galería...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout
        headerProps={{
          icon: Images,
          title: "Galería",
          actionButton: {
            label: 'Subir Archivo',
            icon: Plus,
            onClick: () => openModal('gallery')
          }
        }}
      >
        <EmptyState
          title="Error al cargar"
          description="No se pudieron cargar los archivos de la galería."
          action={
            <Button onClick={() => openModal('gallery')}>
              <Plus className="w-4 h-4 mr-2" />
              Subir Archivo
            </Button>
          }
        />
      </Layout>
    );
  }

  return (
    <Layout
      headerProps={{
        icon: Images,
        title: "Galería",
        actionButton: {
          label: 'Subir Archivo',
          icon: Plus,
          onClick: () => openModal('gallery')
        }
      }}
    >
      <Gallery
        files={galleryFiles}
        onEdit={handleEdit}
        onDownload={handleDownload}
        onDelete={handleDelete}
        showProjectName={!projectId}
      />
    </Layout>
  );
}