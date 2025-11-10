import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/media/ImageLightbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  X, 
  FilterX, 
  Edit, 
  Download, 
  Trash2, 
  PlayCircle, 
  FolderOpen,
  Grid3X3,
  LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

interface GalleryProps {
  files: GalleryFile[];
  onEdit?: (file: GalleryFile) => void;
  onDelete?: (file: GalleryFile) => void;
  onDownload?: (file: GalleryFile) => void;
  showProjectName?: boolean;
}

export function Gallery({ 
  files, 
  onEdit, 
  onDelete, 
  onDownload, 
  showProjectName = false 
}: GalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'Todo' | 'Imágenes' | 'Videos'>('Todo');
  const [galleryStyle, setGalleryStyle] = useState<'uniform' | 'masonry'>('uniform');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'standalone' | 'sitelog'>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter files
  const filteredFiles = useMemo(() => {
    let filtered = files;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // File type filter
    if (fileTypeFilter !== 'Todo') {
      filtered = filtered.filter(file => 
        fileTypeFilter === 'Imágenes'
          ? file.file_type === 'image' || file.file_type?.startsWith('image/')
          : file.file_type === 'video' || file.file_type?.startsWith('video/')
      );
    }

    // Source filter (site_log_id)
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(file => 
        sourceFilter === 'standalone' 
          ? (!file.site_log_id || file.site_log_id === null)
          : (file.site_log_id && file.site_log_id !== null)
      );
    }

    return filtered;
  }, [files, searchTerm, fileTypeFilter, sourceFilter]);

  // Lightbox setup - usar TODAS las imágenes de files, no solo las filtradas
  const imageUrls = useMemo(() => 
    files
      .filter(file => file.file_type === 'image' || file.file_type?.startsWith('image/'))
      .map(file => file.file_url), 
    [files]
  );
  
  const { 
    isOpen: isLightboxOpen, 
    currentIndex, 
    openLightbox, 
    closeLightbox
  } = useImageLightbox(imageUrls);

  const handleImageClick = (file: GalleryFile) => {
    if (file.file_type === 'image' || file.file_type?.startsWith('image/')) {
      const imageIndex = imageUrls.indexOf(file.file_url);
      if (imageIndex !== -1) {
        openLightbox(imageIndex);
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFileTypeFilter('Todo');
    setSourceFilter('all');
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (fileTypeFilter !== 'Todo') count++;
    if (sourceFilter !== 'all') count++;
    return count;
  }, [searchTerm, fileTypeFilter, sourceFilter]);

  if (files.length === 0) {
    return (
      <EmptyState
        title="No hay archivos"
        description="Aún no se han subido archivos a la galería."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons - Always show when we have any files */}
      <div className="hidden md:flex flex-col rounded-lg border border-[var(--card-border)] mb-6 shadow-lg" style={{ backgroundColor: "var(--card-bg)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Filter buttons on the left - Using same style as TableTopBar tabs */}
          <div className="flex items-center gap-1">
            <Button
              variant={fileTypeFilter === 'Todo' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFileTypeFilter('Todo')}
              className={cn(
                "h-8 px-3 text-xs font-normal",
                fileTypeFilter === 'Todo' ? "button-secondary-pressed" : ""
              )}
            >
              Todo
            </Button>
            <Button
              variant={fileTypeFilter === 'Imágenes' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFileTypeFilter('Imágenes')}
              className={cn(
                "h-8 px-3 text-xs font-normal",
                fileTypeFilter === 'Imágenes' ? "button-secondary-pressed" : ""
              )}
            >
              Imágenes
            </Button>
            <Button
              variant={fileTypeFilter === 'Videos' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFileTypeFilter('Videos')}
              className={cn(
                "h-8 px-3 text-xs font-normal",
                fileTypeFilter === 'Videos' ? "button-secondary-pressed" : ""
              )}
            >
              Videos
            </Button>
          </div>

          {/* Actions on the right */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
              }}
              className="h-8 px-3 text-xs"
            >
              <Search className="mr-1 h-3 w-3" />
              Buscar
            </Button>
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3 text-xs",
                    activeFiltersCount > 0 && "bg-secondary text-secondary-foreground"
                  )}
                >
                  <Filter className="mr-1 h-3 w-3" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-3">
                  {/* Filtro por Tipo de Archivo */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Tipo de Archivo</label>
                    <Select
                      value={fileTypeFilter}
                      onValueChange={(value: 'Todo' | 'Imágenes' | 'Videos') => setFileTypeFilter(value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todo">Todos los archivos</SelectItem>
                        <SelectItem value="Imágenes">Solo imágenes</SelectItem>
                        <SelectItem value="Videos">Solo videos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Fuente */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Fuente del Archivo</label>
                    <Select
                      value={sourceFilter}
                      onValueChange={(value: 'all' | 'standalone' | 'sitelog') => setSourceFilter(value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los archivos</SelectItem>
                        <SelectItem value="standalone">Archivos independientes</SelectItem>
                        <SelectItem value="sitelog">Archivos de bitácora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGalleryStyle(galleryStyle === 'uniform' ? 'masonry' : 'uniform')}
              className="h-8 px-3 text-xs"
              title={galleryStyle === 'uniform' ? 'Cambiar a estilo mosaico' : 'Cambiar a estilo uniforme'}
            >
              {galleryStyle === 'uniform' ? (
                <LayoutGrid className="mr-1 h-3 w-3" />
              ) : (
                <Grid3X3 className="mr-1 h-3 w-3" />
              )}
              Estilo
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-3 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>



      {/* Gallery Grid */}
      {filteredFiles.length > 0 ? (
        galleryStyle === 'uniform' ? (
          // Uniform Grid Style
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
            {filteredFiles.map((file) => (
              <div key={file.id} className="group relative aspect-square">
                {/* Image/Video Preview */}
                <div 
                  className="w-full h-full cursor-pointer relative overflow-hidden bg-gray-100"
                  onClick={() => handleImageClick(file)}
                >
                  {file.file_type === 'image' || file.file_type?.startsWith('image/') ? (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : file.file_type === 'video' || file.file_type?.startsWith('video/') ? (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                      <PlayCircle className="w-8 h-8 text-white absolute z-10" />
                      <video
                        src={file.file_url}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <FolderOpen className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {onEdit && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(file);
                        }}
                        className=" bg-white/90 hover:bg-white"
                      >
                        <Edit className="w-3 h-3 text-gray-700" />
                      </Button>
                    )}
                    {onDownload && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(file);
                        }}
                        className=" bg-white/90 hover:bg-white"
                      >
                        <Download className="w-3 h-3 text-gray-700" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(file);
                        }}
                        className=" bg-white/90 hover:bg-white"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Masonry Style - Pinterest/Behance like
          <div 
            className="grid gap-1" 
            style={{ 
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridAutoRows: '10px'
            }}
          >
            {filteredFiles.map((file, index) => {
              // Create varied heights for masonry effect
              const heights = [180, 240, 160, 220, 200, 280, 150, 300, 190, 250];
              const itemHeight = heights[index % heights.length];
              const gridRowEnd = Math.ceil(itemHeight / 10);
              
              return (
                <div 
                  key={file.id} 
                  className="group relative overflow-hidden bg-gray-100"
                  style={{ 
                    gridRowEnd: `span ${gridRowEnd}`,
                  }}
                >
                  {/* Image/Video Preview */}
                  <div 
                    className="w-full h-full cursor-pointer relative overflow-hidden"
                    onClick={() => handleImageClick(file)}
                  >
                    {file.file_type === 'image' || file.file_type?.startsWith('image/') ? (
                      <img
                        src={file.file_url}
                        alt={file.file_name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : file.file_type === 'video' || file.file_type?.startsWith('video/') ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                        <PlayCircle className="w-8 h-8 text-white absolute z-10" />
                        <video
                          src={file.file_url}
                          className="absolute inset-0 w-full h-full object-cover"
                          muted
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <FolderOpen className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {onEdit && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(file);
                          }}
                          className=" bg-white/90 hover:bg-white"
                        >
                          <Edit className="w-3 h-3 text-gray-700" />
                        </Button>
                      )}
                      {onDownload && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(file);
                          }}
                          className=" bg-white/90 hover:bg-white"
                        >
                          <Download className="w-3 h-3 text-gray-700" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="secondary"
          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(file);
                          }}
                          className=" bg-white/90 hover:bg-white"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <EmptyState
          icon={<Search className="w-12 h-12 text-muted-foreground" />}
          title="Sin resultados"
          description="No se encontraron archivos con los filtros aplicados. Intenta cambiar los criterios de búsqueda."
          action={
            <Button onClick={clearFilters}>
              <FilterX className="w-4 h-4 mr-2" />
              Limpiar filtros
            </Button>
          }
        />
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={imageUrls}
        isOpen={isLightboxOpen}
        currentIndex={currentIndex}
        onClose={closeLightbox}
      />
    </div>
  );
}