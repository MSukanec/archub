import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Images, 
  Calendar, 
  User, 
  Download, 
  ZoomIn, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  FileImage,
  Video,
  Play
} from "lucide-react";

import { Layout } from '@/components/layout/desktop/Layout';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';
import { useCurrentUser } from '@/hooks/use-current-user';
import { supabase } from '@/lib/supabase';

interface GalleryFile {
  id: string;
  file_url: string;
  file_type: 'image' | 'video';
  original_name: string;
  created_at: string;
  site_log: {
    id: string;
    log_date: string;
    entry_type: string;
    creator: {
      id: string;
      full_name: string;
      avatar_url: string;
    };
  };
}

function useProjectGallery(projectId: string | null) {
  return useQuery({
    queryKey: ['/api/project-gallery', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return [];

      console.log('Fetching gallery files for project:', projectId);

      const { data, error } = await supabase
        .from('site_log_files')
        .select(`
          id,
          file_url,
          file_type,
          original_name,
          created_at,
          site_logs!inner (
            id,
            log_date,
            entry_type,
            created_by,
            organization_members!inner (
              users (
                id,
                full_name,
                avatar_url
              )
            )
          )
        `)
        .eq('site_logs.project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gallery files:', error);
        throw error;
      }

      // Transform data to match interface
      const transformedData = data?.map((file: any) => ({
        id: file.id,
        file_url: file.file_url,
        file_type: file.file_type,
        original_name: file.original_name,
        created_at: file.created_at,
        site_log: {
          id: file.site_logs.id,
          log_date: file.site_logs.log_date,
          entry_type: file.site_logs.entry_type,
          creator: {
            id: file.site_logs.organization_members.users.id,
            full_name: file.site_logs.organization_members.users.full_name,
            avatar_url: file.site_logs.organization_members.users.avatar_url || ""
          }
        }
      })) || [];

      console.log('Gallery files received:', transformedData.length);
      return transformedData as GalleryFile[];
    },
    enabled: !!projectId
  });
}

export default function ConstructionGallery() {
  const { data: userData } = useCurrentUser();
  const currentProject = userData?.preferences?.last_project_id;
  
  const [selectedFile, setSelectedFile] = useState<GalleryFile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [filterDate, setFilterDate] = useState<string>('all');

  const { 
    data: galleryFiles = [], 
    isLoading, 
    error 
  } = useProjectGallery(currentProject);

  // Filter files based on selected filters
  const filteredFiles = galleryFiles.filter(file => {
    const typeMatch = filterType === 'all' || file.file_type === filterType;
    const dateMatch = filterDate === 'all' || 
      format(new Date(file.created_at), 'yyyy-MM') === filterDate;
    return typeMatch && dateMatch;
  });

  // Get unique months for date filter
  const availableMonths = Array.from(new Set(
    galleryFiles.map(file => format(new Date(file.created_at), 'yyyy-MM'))
  )).sort().reverse();

  const openLightbox = (file: GalleryFile) => {
    setSelectedFile(file);
    setCurrentIndex(filteredFiles.findIndex(f => f.id === file.id));
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(prev => prev > 0 ? prev - 1 : filteredFiles.length - 1);
    } else {
      setCurrentIndex(prev => prev < filteredFiles.length - 1 ? prev + 1 : 0);
    }
    setSelectedFile(filteredFiles[currentIndex]);
  };

  const downloadFile = (file: GalleryFile) => {
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.original_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEntryTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'avance_de_obra': 'Avance de Obra',
      'visita_tecnica': 'Visita Técnica',
      'problema_detectado': 'Problema Detectado',
      'pedido_material': 'Pedido Material',
      'nota_climatica': 'Nota Climática',
      'decision': 'Decisión',
      'inspeccion': 'Inspección',
      'foto_diaria': 'Foto Diaria',
      'registro_general': 'Registro General'
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando galería...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-2">Error al cargar la galería</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (galleryFiles.length === 0) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Images className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Galería del Proyecto</h1>
                <p className="text-sm text-muted-foreground">
                  Fotos y videos de las bitácoras
                </p>
              </div>
            </div>
          </div>

          <CustomEmptyState
            icon={Images}
            title="No hay archivos en la galería"
            description="Los archivos que subas en las bitácoras aparecerán aquí"
            actionText="Ir a Bitácora"
            actionHref="/construction/logs"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Images className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Galería del Proyecto</h1>
              <p className="text-sm text-muted-foreground">
                {filteredFiles.length} archivo{filteredFiles.length !== 1 ? 's' : ''} encontrado{filteredFiles.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="image">Imágenes</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>

            {availableMonths.length > 0 && (
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los meses</SelectItem>
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month}>
                      {format(new Date(month + '-01'), 'MMMM yyyy', { locale: es })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredFiles.length === 0 ? (
          <CustomEmptyState
            icon={Filter}
            title="No se encontraron archivos"
            description="Intenta cambiar los filtros para ver más resultados"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredFiles.map((file) => (
              <Card 
                key={file.id} 
                className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200"
                onClick={() => openLightbox(file)}
              >
                <CardContent className="p-0 aspect-square relative">
                  {file.file_type === 'image' ? (
                    <img
                      src={file.file_url}
                      alt={file.original_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                      <Play className="h-8 w-8 text-white" />
                      <Video className="absolute top-2 right-2 h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  {/* Overlay with info */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={file.site_log.creator.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {file.site_log.creator.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate">
                          {file.site_log.creator.full_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">
                          {format(new Date(file.created_at), 'dd/MM/yyyy')}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getEntryTypeLabel(file.site_log.entry_type)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* File type indicator */}
                  <div className="absolute top-2 left-2">
                    {file.file_type === 'image' ? (
                      <FileImage className="h-4 w-4 text-white drop-shadow-lg" />
                    ) : (
                      <Video className="h-4 w-4 text-white drop-shadow-lg" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {selectedFile && (
          <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
            <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Navigation */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigateImage('prev')}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigateImage('next')}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-6 w-6" />
                </Button>

                {/* File content */}
                <div className="w-full h-full flex items-center justify-center p-4">
                  {selectedFile.file_type === 'image' ? (
                    <img
                      src={selectedFile.file_url}
                      alt={selectedFile.original_name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <video
                      src={selectedFile.file_url}
                      controls
                      className="max-w-full max-h-full"
                    />
                  )}
                </div>

                {/* File info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedFile.site_log.creator.avatar_url} />
                        <AvatarFallback>
                          {selectedFile.site_log.creator.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedFile.site_log.creator.full_name}</p>
                        <p className="text-sm text-gray-300">
                          {format(new Date(selectedFile.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {getEntryTypeLabel(selectedFile.site_log.entry_type)}
                      </Badge>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadFile(selectedFile)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}