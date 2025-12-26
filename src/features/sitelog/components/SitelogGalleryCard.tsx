import { Image, Video, HardDrive, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SitelogGalleryFile } from '../types';

interface SitelogGalleryCardProps {
  files: SitelogGalleryFile[];
}

export function SitelogGalleryCard({ files }: SitelogGalleryCardProps) {
  // Calcular estadísticas
  const totalImages = files.filter(f => f.file_type === 'image').length;
  const totalVideos = files.filter(f => f.file_type === 'video').length;
  const totalSize = files.reduce((sum, f) => sum + (f.file_size || 0), 0);
  const lastFile = files.length > 0 ? files[0] : null; // Ya vienen ordenados desc

  // Formatear tamaño total
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Formatear fecha del último archivo
  const lastUploadDate = lastFile
    ? format(new Date(lastFile.created_at), "d 'de' MMMM, yyyy", { locale: es })
    : 'N/A';

  return (
    <Card className="w-full p-6" data-testid="card-sitelog-stats">
      {/* Header: Title/Value on left, KPIs on right */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Archivos Multimedia de Bitácoras
          </p>
          <p className="text-4xl font-bold" data-testid="text-total-files">
            {files.length}
          </p>
          <p className="text-sm text-muted-foreground">
            Fotos y videos subidos en bitácoras de obra
          </p>
        </div>
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 md:grid-cols-2 gap-4">
          {/* Images */}
          <div className="flex items-center gap-2" data-testid="stat-images">
            <Image className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Fotos</p>
              <p className="text-lg font-semibold" data-testid="text-total-images">
                {totalImages}
              </p>
            </div>
          </div>

          {/* Videos */}
          <div className="flex items-center gap-2" data-testid="stat-videos">
            <Video className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Videos</p>
              <p className="text-lg font-semibold" data-testid="text-total-videos">
                {totalVideos}
              </p>
            </div>
          </div>

          {/* Total Size */}
          <div className="flex items-center gap-2" data-testid="stat-size">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Tamaño Total</p>
              <p className="text-lg font-semibold" data-testid="text-total-size">
                {formatSize(totalSize)}
              </p>
            </div>
          </div>

          {/* Last Upload */}
          <div className="flex items-center gap-2" data-testid="stat-last-upload">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Último Subido</p>
              <p className="text-sm font-medium" data-testid="text-last-upload">
                {lastUploadDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
