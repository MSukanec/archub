import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { MediaLightbox, useMediaLightbox, type MediaItem } from '@/components/shared/viewers/ImageLightbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  X, 
  FilterX, 
  Download, 
  Trash2, 
  PlayCircle, 
  FolderOpen,
  Grid3X3,
  LayoutGrid,
  MoreVertical,
  Image as ImageIcon,
  Video,
  FileText,
  BookOpen,
  Users,
  DollarSign,
  GraduationCap
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface GalleryFile {
  id: string;
  link_id?: string; // ID del media_link (requerido para eliminación en nueva arquitectura)
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
  movement_id?: string | null;
  contact_id?: string | null;
  course_lesson_id?: string | null;
  general_cost_payment_id?: string | null;
  client_payment_id?: string | null;
}

// Helper para obtener el icono según el tipo de archivo
function getFileTypeIcon(fileType: string) {
  if (fileType === 'image' || fileType?.startsWith('image/')) {
    return ImageIcon;
  } else if (fileType === 'video' || fileType?.startsWith('video/')) {
    return Video;
  }
  return FileText;
}

// Helper para obtener el icono y label según el origen del archivo
function getSourceInfo(file: GalleryFile): { icon: any; label: string; color: string } | null {
  if (file.site_log_id) {
    return { icon: BookOpen, label: 'Bitácora', color: 'bg-blue-500' };
  }
  if (file.client_payment_id) {
    return { icon: Users, label: 'Clientes', color: 'bg-purple-500' };
  }
  if (file.movement_id) {
    return { icon: DollarSign, label: 'Movimientos', color: 'bg-green-500' };
  }
  if (file.contact_id) {
    return { icon: Users, label: 'Contactos', color: 'bg-orange-500' };
  }
  if (file.course_lesson_id) {
    return { icon: GraduationCap, label: 'Cursos', color: 'bg-indigo-500' };
  }
  if (file.general_cost_payment_id) {
    return { icon: DollarSign, label: 'Costos', color: 'bg-yellow-500' };
  }
  return null;
}

interface GalleryProps {
  files: GalleryFile[];
  onDelete?: (file: GalleryFile) => void;
  onDownload?: (file: GalleryFile) => void;
  showProjectName?: boolean;
  galleryStyle?: 'uniform' | 'masonry';
  hideActionBar?: boolean;
}

export function Gallery({ 
  files, 
  onDelete, 
  onDownload, 
  showProjectName = false,
  galleryStyle = 'uniform',
  hideActionBar = false
}: GalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'Todo' | 'Imágenes' | 'Videos'>('Todo');
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

  // Lightbox setup - usar TODOS los archivos multimedia (imágenes y videos)
  const mediaItems = useMemo<MediaItem[]>(() => 
    files
      .filter(file => 
        file.file_type === 'image' || file.file_type?.startsWith('image/') ||
        file.file_type === 'video' || file.file_type?.startsWith('video/')
      )
      .map(file => ({
        type: (file.file_type === 'video' || file.file_type?.startsWith('video/')) ? 'video' as const : 'image' as const,
        src: file.file_url
      })), 
    [files]
  );
  
  const { 
    isOpen: isLightboxOpen, 
    currentIndex, 
    openLightbox, 
    closeLightbox
  } = useMediaLightbox(mediaItems);

  const handleMediaClick = (file: GalleryFile) => {
    const isMediaFile = file.file_type === 'image' || file.file_type?.startsWith('image/') ||
                        file.file_type === 'video' || file.file_type?.startsWith('video/');
    
    if (isMediaFile) {
      // Para imágenes y videos, abrir en lightbox
      const mediaIndex = files
        .filter(f => 
          f.file_type === 'image' || f.file_type?.startsWith('image/') ||
          f.file_type === 'video' || f.file_type?.startsWith('video/')
        )
        .findIndex(f => f.id === file.id);
      if (mediaIndex !== -1) {
        openLightbox(mediaIndex);
      }
    } else {
      // Para documentos y otros archivos, abrir en nueva pestaña
      window.open(file.file_url, '_blank');
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
      {!hideActionBar && (
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
                console.log("Search clicked - TODO: Implement search modal");
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
      )}

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
                  onClick={() => handleMediaClick(file)}
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
                  
                  {/* Badges en la esquina superior izquierda */}
                  <div className="absolute top-2 left-2 flex gap-1 z-10">
                    {/* Badge 1: Tipo de archivo */}
                    {(() => {
                      const FileIcon = getFileTypeIcon(file.file_type);
                      return (
                        <div
                          className="h-6 w-6 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-gray-300 flex items-center justify-center"
                          title={file.file_type === 'image' || file.file_type?.startsWith('image/') ? 'Imagen' : file.file_type === 'video' || file.file_type?.startsWith('video/') ? 'Video' : 'Documento'}
                        >
                          <FileIcon className="h-3.5 w-3.5 text-gray-700" />
                        </div>
                      );
                    })()}
                    
                    {/* Badge 2: Origen del archivo */}
                    {(() => {
                      const sourceInfo = getSourceInfo(file);
                      if (!sourceInfo) return null;
                      const SourceIcon = sourceInfo.icon;
                      return (
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full shadow-md border border-white/50 flex items-center justify-center",
                            sourceInfo.color
                          )}
                          title={sourceInfo.label}
                        >
                          <SourceIcon className="h-3.5 w-3.5 text-white" />
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Botón de opciones arriba a la derecha */}
                  {(onDownload || onDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button
                          className="absolute top-2 right-2 h-8 w-8 rounded-md bg-white/90 backdrop-blur-sm shadow-lg border border-gray-300 flex items-center justify-center transition-all hover:bg-white opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 z-20"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-700" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onDownload && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownload(file);
                            }}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent hover:text-black dark:hover:text-white transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Descargar
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <>
                            {onDownload && <DropdownMenuSeparator className="bg-border" />}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(file);
                              }}
                              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent text-foreground hover:text-red-600 dark:hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
                    onClick={() => handleMediaClick(file)}
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
                    
                    {/* Badges en la esquina superior izquierda */}
                    <div className="absolute top-2 left-2 flex gap-1 z-10">
                      {/* Badge 1: Tipo de archivo */}
                      {(() => {
                        const FileIcon = getFileTypeIcon(file.file_type);
                        return (
                          <div
                            className="h-6 w-6 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-gray-300 flex items-center justify-center"
                            title={file.file_type === 'image' || file.file_type?.startsWith('image/') ? 'Imagen' : file.file_type === 'video' || file.file_type?.startsWith('video/') ? 'Video' : 'Documento'}
                          >
                            <FileIcon className="h-3.5 w-3.5 text-gray-700" />
                          </div>
                        );
                      })()}
                      
                      {/* Badge 2: Origen del archivo */}
                      {(() => {
                        const sourceInfo = getSourceInfo(file);
                        if (!sourceInfo) return null;
                        const SourceIcon = sourceInfo.icon;
                        return (
                          <div
                            className={cn(
                              "h-6 w-6 rounded-full shadow-md border border-white/50 flex items-center justify-center",
                              sourceInfo.color
                            )}
                            title={sourceInfo.label}
                          >
                            <SourceIcon className="h-3.5 w-3.5 text-white" />
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Botón de opciones arriba a la derecha */}
                    {(onDownload || onDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button
                            className="absolute top-2 right-2 h-8 w-8 rounded-md bg-white/90 backdrop-blur-sm shadow-lg border border-gray-300 flex items-center justify-center transition-all hover:bg-white opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 z-20"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-700" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onDownload && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDownload(file);
                              }}
                              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent hover:text-black dark:hover:text-white transition-colors"
                            >
                              <Download className="h-4 w-4" />
                              Descargar
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <>
                              {onDownload && <DropdownMenuSeparator className="bg-border" />}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(file);
                                }}
                                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent text-foreground hover:text-red-600 dark:hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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

      {/* Media Lightbox (imágenes y videos) */}
      <MediaLightbox
        media={mediaItems}
        isOpen={isLightboxOpen}
        currentIndex={currentIndex}
        onClose={closeLightbox}
      />
    </div>
  );
}