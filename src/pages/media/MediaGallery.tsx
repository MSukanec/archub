import { useState } from 'react';
import { Gallery as GalleryComponent } from '@/components/shared/viewers/Gallery';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Images, Plus } from 'lucide-react';
import { 
  useCurrentProject, 
  useGalleryFiles, 
  useDeleteMediaFile,
  MediaStatsSection,
  type GalleryFile 
} from '@/features/media';

export function MediaGallery() {
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const [galleryStyle, setGalleryStyle] = useState<'uniform' | 'masonry'>('uniform');
  
  const storedProjectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.organization?.id;

  // Get current project
  const { data: currentProject } = useCurrentProject(storedProjectId, organizationId);

  // Get gallery files using the new hook
  const { 
    data: allFiles = [], 
    isLoading: galleryLoading, 
    error: galleryError 
  } = useGalleryFiles(organizationId, currentProject?.id);

  // Show all files in gallery
  const galleryFiles = allFiles;

  // Delete mutation
  const deleteFileMutation = useDeleteMediaFile();

  // Handlers
  const handleDownload = async (file: GalleryFile) => {
    if (!file.file_url) return;

    try {
      // Try to download via fetch first (works better with CORS)
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // If download fails (CORS, etc), open in new window
      console.warn('Download failed, opening in new window:', error);
      window.open(file.file_url, '_blank');
    }
  };

  const handleDelete = (file: GalleryFile) => {
    // Ensure link_id exists - use id as fallback if link_id is missing
    const linkId = file.link_id || file.id;
    
    if (!linkId) {
      toast({
        title: 'Error',
        description: 'No se pudo determinar el ID del archivo para eliminar',
        variant: 'destructive',
      });
      return;
    }

    openModal('delete-confirmation', {
      mode: 'delete',
      title: 'Eliminar archivo',
      description: `¿Estás seguro de que deseas eliminar "${file.file_name}"?`,
      itemName: file.file_name,
      destructiveActionText: 'Eliminar archivo',
      onDelete: () => {
        deleteFileMutation.mutate(linkId, {
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
          },
        });
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
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['gallery-files'] })}>
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
    <div className="space-y-6">
      {galleryFiles.length > 0 && (
        <MediaStatsSection 
          galleryFiles={galleryFiles.map(file => ({
            ...file,
            file_size: file.file_size ?? undefined
          })) as any}
          galleryStyle={galleryStyle}
          onGalleryStyleChange={() => setGalleryStyle(galleryStyle === 'uniform' ? 'masonry' : 'uniform')}
        />
      )}
      
      <GalleryComponent
        files={galleryFiles.map(file => ({
          ...file,
          file_size: file.file_size ?? undefined
        })) as any}
        onDownload={handleDownload as any}
        onDelete={handleDelete as any}
        galleryStyle={galleryStyle}
        hideActionBar={true}
      />
    </div>
  );
}
