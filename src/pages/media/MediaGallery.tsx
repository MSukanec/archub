import { Gallery as GalleryComponent } from '@/components/ui-custom/media/Gallery';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
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

  // Filter to only show images and videos in gallery (documents go to Documentation tab)
  const galleryFiles = allFiles.filter(file => 
    file.file_type?.startsWith('image/') || file.file_type?.startsWith('video/')
  );

  // Delete mutation
  const deleteFileMutation = useDeleteMediaFile();

  // Handlers
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
    deleteFileMutation.mutate(file.id, {
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
        <MediaStatsSection galleryFiles={galleryFiles} />
      )}
      
      <GalleryComponent
        files={galleryFiles as any}
        onEdit={handleEdit as any}
        onDownload={handleDownload as any}
        onDelete={handleDelete as any}
      />
    </div>
  );
}
