import React from 'react';
import { Gallery as GalleryComponent } from '@/components/shared/viewers/Gallery';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal';
import { useCurrentUser } from '@/features/users/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Images, Plus } from 'lucide-react';
import { useGalleryFiles, useDeleteMediaFile } from '@/features/media';

// Gallery file interface - compatible with Gallery component
interface GalleryFile {
  id: string;
  link_id?: string; // ID del link en media_links (para eliminar)
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
  const organizationId = userData?.organization?.id;
  const projectId = userData?.preferences?.last_project_id;

  // Usar hooks del feature de media (nueva arquitectura)
  const { data: galleryFilesRaw = [], isLoading: galleryLoading, error: galleryError } = useGalleryFiles(
    organizationId,
    projectId
  );

  // Mapear a formato compatible con Gallery component
  const galleryFiles: GalleryFile[] = galleryFilesRaw.map(file => {
    const mapped = {
      id: file.id,
      link_id: file.link_id, // CRÍTICO: ID del link para poder eliminar
      file_url: file.file_url,
      file_name: file.file_name,
      file_type: file.file_type,
      file_size: file.file_size || undefined,
      created_at: file.created_at,
      project_id: file.project_id || '',
      project_name: file.project_name,
      description: file.description || undefined,
      visibility: file.visibility || 'organization',
      created_by: file.created_by || 'Desconocido',
      site_log_id: file.site_log_id
    };
    
    // DEBUG: Ver primer archivo
    if (galleryFilesRaw.indexOf(file) === 0) {
      console.log('[MediaGallery] Primer archivo:', {
        file_id: mapped.id,
        link_id: mapped.link_id,
        file_name: mapped.file_name
      });
    }
    
    return mapped;
  });

  // Delete file mutation usando nuevo servicio
  const deleteFileMutation = useDeleteMediaFile();

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
    // DEBUG: Ver qué datos tiene el file cuando hacemos delete
    console.log('[MediaGallery] handleDelete called with:', {
      file_id: file.id,
      link_id: file.link_id,
      file_name: file.file_name
    });
    
    // Usar link_id para eliminar (NO el media_file.id)
    if (!file.link_id) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el archivo: ID de link no encontrado',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('[MediaGallery] About to delete link_id:', file.link_id);
    
    deleteFileMutation.mutate(file.link_id, {
      onSuccess: () => {
        toast({
          title: 'Éxito',
          description: 'Archivo eliminado correctamente',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el archivo',
          variant: 'destructive',
        });
        console.error('Delete error:', error);
      }
    });
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