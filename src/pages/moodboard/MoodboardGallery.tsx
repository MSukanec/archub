import { Gallery as GalleryComponent } from '@/components/shared/viewers/Gallery';
import { EmptyState } from '@/components/shared/EmptyState';
import { Palette } from 'lucide-react';
import { usePins } from '@/features/moodboard';
import type { Pin } from '@/features/moodboard';
import { useProjectContext } from '@/stores/projectContext';
interface MoodboardGalleryProps {
  boardId?: string;
}
export function MoodboardGallery({ boardId }: MoodboardGalleryProps) {
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  
  const { 
    data: pins = [], 
    isLoading, 
    error 
  } = usePins(currentOrganizationId || undefined, selectedProjectId || undefined);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-moodboard">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando moodboard...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <EmptyState
        icon={<Palette />}
        title="Error al cargar el moodboard"
        description="Hubo un problema al cargar los pins de inspiración"
      />
    );
  }
  // Si estamos viendo un tablero específico, filtrar pins de ese tablero
  const filteredPins = boardId 
    ? pins.filter((pin: Pin) => {
        // Nota: Necesitaremos agregar board_id a los pins del backend
        // Por ahora mostramos todos los pins
        return true;
      })
    : pins;
  if (filteredPins.length === 0) {
    return (
      <EmptyState
        icon={<Palette />}
        title="Sin pins en este tablero"
        description="Aún no hay imágenes en este tablero. Usa el botón Agregar para subir inspiración."
      />
    );
  }
  const galleryItems = filteredPins
    .filter((pin: Pin) => pin.signed_url || pin.image_url)
    .map((pin: Pin) => ({
      id: pin.id,
      link_id: pin.id,
      file_url: pin.signed_url || pin.image_url!,
      file_name: pin.title || 'Sin título',
      file_type: 'image',
      file_size: undefined,
      created_at: pin.created_at,
      project_id: pin.project_id || '',
      project_name: pin.project_id ? 'Proyecto': 'Organización',
      description: pin.source_url || undefined,
      visibility: 'organization',
      created_by: 'Extensión Chrome'
    }));
  return (
    <div className="space-y-6" data-testid="moodboard-gallery">
      <GalleryComponent
        files={galleryItems}
        galleryStyle="masonry"
        onDownload={(file) => {
          if (file.file_url) {
            window.open(file.file_url, '_blank');
          }
        }}
      />
    </div>
  );
}
