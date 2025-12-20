import { useMemo } from 'react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Gallery } from '@/components/shared/viewers/Gallery';
import type { SitelogGalleryFile } from '../types';

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
  files: SitelogGalleryFile[];
  onDelete?: (file: SitelogGalleryFile) => void;
  onDownload?: (file: SitelogGalleryFile) => void;
  onEdit?: (file: SitelogGalleryFile) => void;
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

  // Agrupar archivos por semana (usa la fecha de la bitácora, no la fecha de subida)
  const groupedByWeek = useMemo(() => {
    const groups = new Map<string, GroupedFiles>();

    // Primero ordenar archivos por fecha de bitácora (más recientes primero)
    const sortedFiles = [...galleryFiles].sort((a, b) => {
      const originalA = files.find(f => f.id === a.id);
      const originalB = files.find(f => f.id === b.id);
      
      const dateA = originalA?.site_log?.date 
        ? new Date(originalA.site_log.date).getTime()
        : new Date(a.created_at).getTime();
      const dateB = originalB?.site_log?.date 
        ? new Date(originalB.site_log.date).getTime()
        : new Date(b.created_at).getTime();
      
      return dateB - dateA; // Más recientes primero
    });

    sortedFiles.forEach(file => {
      // Obtener el archivo original para acceder a site_log.date
      const originalFile = files.find(f => f.id === file.id);
      const fileDate = originalFile?.site_log?.date 
        ? new Date(originalFile.site_log.date) 
        : new Date(file.created_at);
      const weekStart = startOfWeek(fileDate, { weekStartsOn: 1, locale: es }); // Lunes
      const weekEnd = endOfWeek(fileDate, { weekStartsOn: 1, locale: es }); // Domingo
      
      // Crear label de semana: "Semana del 1-7 nov" (primera letra en mayúscula, resto en minúsculas)
      const weekLabelRaw = `semana del ${format(weekStart, 'd', { locale: es })}-${format(weekEnd, 'd MMM', { locale: es })}`;
      const weekLabel = weekLabelRaw.charAt(0).toUpperCase() + weekLabelRaw.slice(1);
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
  }, [galleryFiles, files]);

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {groupedByWeek.map((group, index) => (
        <div key={group.weekStart.toISOString()} className="space-y-4">
          {/* Separador visual por semana */}
          <div className="relative flex items-center my-6">
            <div className="flex-shrink-0 pr-4">
              <span className="text-xs font-medium text-border/60">
                {group.weekLabel}
              </span>
            </div>
            <div className="flex-grow border-t border-border/40"></div>
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
