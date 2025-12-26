import { Image, Video, LayoutGrid, Grid3X3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SparklineChart } from '@/components/charts/sparkline/SparklineChart';
import { useMediaMetrics } from '../hooks/use-media-metrics';
import type { GalleryFile } from '../types';
interface MediaStatsSectionProps {
  galleryFiles: GalleryFile[];
  galleryStyle: 'uniform'| 'masonry';
  onGalleryStyleChange: () => void;
}
export function MediaStatsSection({ galleryFiles, galleryStyle, onGalleryStyleChange }: MediaStatsSectionProps) {
  const {
    totalFiles,
    totalImages,
    totalVideos,
    timeline
  } = useMediaMetrics(galleryFiles);
  return (
    <Card className="w-full p-6" data-testid="card-media-stats">
      {/* Header: Title/Value on left, KPIs on right */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total Archivos
          </p>
          <p className="text-4xl font-bold" data-testid="text-total-files">
            {totalFiles}
          </p>
          <p className="text-sm text-muted-foreground">
            Galería completa de imágenes y videos del proyecto
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-6">
          {/* Images */}
          <div className="flex items-center gap-2" data-testid="stat-images">
            <Image className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Imágenes</span>
            <span className="text-lg font-semibold" data-testid="text-total-images">
              {totalImages}
            </span>
          </div>
          {/* Videos */}
          <div className="flex items-center gap-2" data-testid="stat-videos">
            <Video className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Videos</span>
            <span className="text-lg font-semibold" data-testid="text-total-videos">
              {totalVideos}
            </span>
          </div>
          {/* Style Toggle Button */}
          <Button 
            variant="ghost"
            size="sm"
            onClick={onGalleryStyleChange}
            className="ml-4 h-8 px-3"
            title={galleryStyle === 'uniform'? 'Cambiar a estilo mosaico': 'Cambiar a estilo uniforme'}
            data-testid="button-gallery-style"
          >
            {galleryStyle === 'uniform'? (
              <LayoutGrid className="w-4 h-4 mr-2" />
            ) : (
              <Grid3X3 className="w-4 h-4 mr-2" />
            )}
            Estilo
          </Button>
        </div>
      </div>
      {/* Sparkline Chart */}
      <div>
        <SparklineChart 
          data={timeline}
          color="var(--accent)"
        />
      </div>
    </Card>
  );
}
