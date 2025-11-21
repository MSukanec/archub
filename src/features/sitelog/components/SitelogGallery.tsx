import { useMemo } from 'react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Gallery } from '@/components/ui-custom/media/Gallery';
import type { MediaFileWithLink } from '@/features/media/types';

// GalleryFile type compatible with Gallery component
interface GalleryFile {
  id: string;
  link_id?: string;
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

interface SitelogGalleryProps {
  files: MediaFileWithLink[];
  onDelete?: (file: MediaFileWithLink) => void;
  onDownload?: (file: MediaFileWithLink) => void;
  onEdit?: (file: MediaFileWithLink) => void;
}

interface GroupedFiles {
  weekLabel: string;
  weekStart: Date;
  files: GalleryFile[];
}

export function SitelogGallery({ files, onDelete, onDownload, onEdit }: SitelogGalleryProps) {
  // Mapear MediaFileWithLink a GalleryFile compatible con Gallery component
  const galleryFiles: GalleryFile[] = useMemo(() => 
    files.map(file => ({
      id: file.id,
      link_id: file.link_id,
      file_url: file.file_url,
      file_name: file.file_name,
      file_type: file.file_type,
      file_size: file.file_size ?? undefined, // Convert null to undefined
      created_at: file.created_at,
      project_id: file.project_id || '',
      project_name: file.project_name,
      description: file.description || undefined,
      visibility: file.visibility || 'organization',
      created_by: file.created_by || 'Desconocido',
      site_log_id: file.site_log_id
    })),
    [files]
  );

  // Agrupar archivos por semana
  const groupedByWeek = useMemo(() => {
    const groups = new Map<string, GroupedFiles>();

    galleryFiles.forEach(file => {
      const fileDate = new Date(file.created_at);
      const weekStart = startOfWeek(fileDate, { weekStartsOn: 1, locale: es }); // Lunes
      const weekEnd = endOfWeek(fileDate, { weekStartsOn: 1, locale: es }); // Domingo
      
      // Crear label de semana: "Semana del 1-7 Nov"
      const weekLabel = `Semana del ${format(weekStart, 'd', { locale: es })}-${format(weekEnd, 'd MMM', { locale: es })}`;
      const weekKey = weekStart.toISOString();

      if (!groups.has(weekKey)) {
        groups.set(weekKey, {
          weekLabel,
          weekStart,
          files: []
        });
      }

      groups.get(weekKey)!.files.push(file);
    });

    // Convertir a array y ordenar por fecha (más recientes primero)
    return Array.from(groups.values()).sort((a, b) => 
      b.weekStart.getTime() - a.weekStart.getTime()
    );
  }, [galleryFiles]);

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {groupedByWeek.map((group, index) => (
        <div key={group.weekStart.toISOString()} className="space-y-4">
          {/* Separador visual por semana */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {group.weekLabel}
            </h3>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Gallery component reutilizado para cada grupo */}
          <Gallery
            files={group.files}
            onEdit={onEdit ? (file) => {
              // Find original MediaFileWithLink by id
              const original = files.find(f => f.id === file.id);
              if (original && onEdit) onEdit(original);
            } : undefined}
            onDownload={onDownload ? (file) => {
              const original = files.find(f => f.id === file.id);
              if (original && onDownload) onDownload(original);
            } : undefined}
            onDelete={onDelete ? (file) => {
              const original = files.find(f => f.id === file.id);
              if (original && onDelete) onDelete(original);
            } : undefined}
            showProjectName={false}
            galleryStyle="uniform"
            hideActionBar={true}
          />
        </div>
      ))}
    </div>
  );
}
