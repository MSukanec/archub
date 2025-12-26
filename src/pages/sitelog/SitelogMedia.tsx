import { useCurrentUser } from '@/hooks/use-current-user';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useSitelogGallery } from '@/features/sitelog/hooks/use-sitelog-gallery';
import { useDeleteMediaFile } from '@/features/media';
import { SitelogGalleryCard } from '@/features/sitelog/components/SitelogGalleryCard';
import { SitelogGallery } from '@/features/sitelog/components/SitelogGallery';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Images } from 'lucide-react';
import type { SitelogGalleryFile } from '@/features/sitelog/types';

export default function SitelogMedia() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Obtener organizationId y projectId del usuario actual
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const projectId = userData?.preferences?.last_project_id;

  // Hook para obtener archivos multimedia de bitácoras
  const { 
    data: sitelogFiles = [], 
    isLoading, 
    error 
  } = useSitelogGallery(organizationId, projectId);

  // Hook para eliminar archivos
  const deleteFileMutation = useDeleteMediaFile();

  // Handlers
  const handleDownload = (file: SitelogGalleryFile) => {
    if (file.file_url) {
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = (file: SitelogGalleryFile) => {
    if (!file.link_id) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el archivo: ID de link no encontrado',
        variant: 'destructive',
      });
      return;
    }
    
    deleteFileMutation.mutate(file.link_id, {
      onSuccess: () => {
        toast({
          title: 'Éxito',
          description: 'Archivo eliminado correctamente',
        });
        // Invalidar ambos queries: galería y entradas de bitácora
        queryClient.invalidateQueries({ queryKey: ['sitelog-gallery'] });
        queryClient.invalidateQueries({ queryKey: ['site-logs'] });
        queryClient.invalidateQueries({ queryKey: ['sitelog-timeline'] });
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando archivos multimedia...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon={<Images />}
        title="Error al cargar archivos"
        description="Hubo un problema al cargar los archivos multimedia de bitácoras"
        action={
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['sitelog-gallery'] })}>
            Reintentar
          </Button>
        }
      />
    );
  }

  // Empty state
  if (sitelogFiles.length === 0) {
    return (
      <EmptyState
        icon={<Images />}
        title="No hay archivos multimedia en bitácoras"
        description="Los archivos multimedia subidos en las bitácoras de obra aparecerán aquí"
      />
    );
  }

  // Main render con datos
  return (
    <div className="space-y-6">
      {/* Card de estadísticas arriba */}
      <SitelogGalleryCard files={sitelogFiles} />

      {/* Galería agrupada por semana abajo */}
      <SitelogGallery
        files={sitelogFiles}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </div>
  );
}
