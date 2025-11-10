import React from 'react';
import { Gallery as GalleryComponent } from '@/components/ui-custom/media/Gallery';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Images, Plus } from 'lucide-react';

// Gallery file interface - compatible with Gallery component
interface GalleryFile {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  created_at: string;
  project_id: string;
  project_name?: string;
  description?: string;
  visibility: string;
  created_by: string;
  site_log_id?: string | null;
}

export function MediaGallery() {
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const storedProjectId = userData?.preferences?.last_project_id;

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
        return null;
      }
      
      return data;
    },
    enabled: !!storedProjectId && !!userData?.organization?.id && !!supabase
  });

  // Gallery: Fetch files for organization and project
  const { data: galleryFiles = [], isLoading: galleryLoading, error: galleryError } = useQuery({
    queryKey: ['galleryFiles', userData?.organization?.id, currentProject?.id],
    queryFn: async () => {
      if (!userData?.organization?.id || !supabase) {
        return [];
      }


      // Get organization files (visibility = 'organization')
      const orgQuery = supabase
        .from('project_media')
        .select(`
          id,
          file_url,
          file_type,
          file_name,
          file_size,
          created_at,
          description,
          project_id,
          visibility,
          created_by,
          site_log_id,
          projects!inner(name)
        `)
        .eq('organization_id', userData.organization.id)
        .eq('visibility', 'organization');

      // Get project files if there's a current project (visibility = 'project')
      let projectQuery = null;
      if (currentProject?.id) {
        projectQuery = supabase
          .from('project_media')
          .select(`
            id,
            file_url,
            file_type,
            file_name,
            file_size,
            created_at,
            description,
            project_id,
            visibility,
            created_by,
            site_log_id,
            projects!inner(name)
          `)
          .eq('project_id', currentProject.id)
          .eq('visibility', 'project');
      }

      try {
        const [orgResult, projectResult] = await Promise.all([
          orgQuery,
          projectQuery
        ]);

        if (orgResult.error) throw orgResult.error;
        if (projectResult?.error) throw projectResult.error;

        const orgFiles = orgResult.data || [];
        const projectFiles = projectResult?.data || [];

        // Combine and format files
        const allFiles = [...orgFiles, ...projectFiles].map(file => ({
          ...file,
          project_name: file.projects?.[0]?.name || 'Sin proyecto',
          created_by: file.created_by || 'Desconocido',
          site_log_id: file.site_log_id || null
        }));

        // Sort by creation date (newest first)
        return allFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } catch (error) {
        throw error;
      }
    },
    enabled: !!userData?.organization?.id && !!supabase
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');

      // Get file data first
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
    },
  });

  // Gallery handlers
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

  if (galleryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando galería...</p>
        </div>
      </div>
    );
  }

  if (galleryError) {
    return (
      <EmptyState
        icon={<Images />}
        title="Error al cargar la galería"
        description="Hubo un problema al cargar los archivos de la galería"
        action={
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['galleryFiles'] })}>
            Reintentar
          </Button>
        }
      />
    );
  }

  if (galleryFiles.length === 0) {
    return (
      <EmptyState
        icon={<Images />}
        title="No hay archivos en la galería"
        description="Sube imágenes y videos para comenzar a construir tu galería de proyecto"
        action={
          <Button onClick={() => openModal('gallery', {})}>
            <Plus className="w-4 h-4 mr-2" />
            Subir Archivo
          </Button>
        }
      />
    );
  }

  return (
    <GalleryComponent
      files={galleryFiles}
      onEdit={handleEdit}
      onDownload={handleDownload}
      onDelete={handleDelete}
    />
  );
}