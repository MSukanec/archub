import { useState, useMemo, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { Layout } from '@/components/layout/desktop/Layout';
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Images, 
  Filter, 
  Calendar, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  PlayCircle, 
  X 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Gallery file interface
interface GalleryFile {
  id: string;
  file_url: string;
  file_type: string;
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



export default function ConstructionGallery() {
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  
  const { data: galleryFiles = [], isLoading, error } = useQuery({
    queryKey: ['galleryFiles', projectId],
    queryFn: async () => {
      console.log('Fetching gallery files for project:', projectId);
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('site_log_files')
        .select(`
          id,
          file_url,
          file_type,
          file_name,
          created_at,
          site_logs!inner(
            id,
            log_date,
            entry_type,
            created_by,
            project_id
          )
        `)
        .eq('site_logs.project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gallery files:', error);
        throw error;
      }

      // Get unique creator IDs
      const creatorIds = Array.from(new Set(data?.map((file: any) => file.site_logs?.created_by).filter(Boolean)));
      
      let creators: Record<string, any> = {};
      if (creatorIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', creatorIds);
        
        if (usersData) {
          creators = usersData.reduce((acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      // Transform data to match interface
      const transformedData = data?.map((file: any) => ({
        id: file.id,
        file_url: file.file_url,
        file_type: file.file_type,
        original_name: file.file_name || file.file_url?.split('/').pop() || 'archivo',
        created_at: file.site_logs.log_date,
        site_log: {
          id: file.site_logs.id,
          log_date: file.site_logs.log_date,
          entry_type: file.site_logs.entry_type,
          creator: creators[file.site_logs.created_by] || {
            id: file.site_logs.created_by,
            full_name: "Usuario",
            avatar_url: ""
          }
        }
      })) || [];

      return transformedData;
    },
    enabled: !!projectId
  });
  const [selectedFile, setSelectedFile] = useState<GalleryFile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [filterDate, setFilterDate] = useState<string>('all');

  // Reset filters when project changes
  useEffect(() => {
    setFilterType('all');
    setFilterDate('all');
  }, [projectId]);

  // Filter files based on type and date
  const filteredFiles = useMemo(() => {
    let filtered = galleryFiles;

    // Filter by file type
    if (filterType !== 'all') {
      filtered = filtered.filter(file => 
        filterType === 'image'
          ? file.file_type === 'image' || file.file_type?.startsWith('image/')
          : file.file_type === 'video' || file.file_type?.startsWith('video/')
      );
    }

    // Filter by date
    if (filterDate !== 'all') {
      filtered = filtered.filter(file => 
        file.created_at?.startsWith(filterDate)
      );
    }

    return filtered;
  }, [galleryFiles, filterType, filterDate]);

  // Get available months for filter
  const availableMonths = useMemo(() => {
    const months = galleryFiles.map(file => file.created_at?.substring(0, 7)).filter(Boolean);
    const uniqueMonths: string[] = [];
    months.forEach(month => {
      if (!uniqueMonths.includes(month)) {
        uniqueMonths.push(month);
      }
    });
    return uniqueMonths.sort().reverse();
  }, [galleryFiles]);

  const openLightbox = (file: GalleryFile) => {
    setSelectedFile(file);
    setCurrentIndex(filteredFiles.findIndex(f => f.id === file.id));
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev'
      ? (currentIndex > 0 ? currentIndex - 1 : filteredFiles.length - 1)
      : (currentIndex < filteredFiles.length - 1 ? currentIndex + 1 : 0);

    setCurrentIndex(newIndex);
    setSelectedFile(filteredFiles[newIndex]);
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
        <CustomEmptyState
          icon={<Images />}
          title="No hay archivos en la galería"
          description="Los archivos que subas en las bitácoras aparecerán aquí"
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">

        {/* Gallery Grid */}
        {filteredFiles.length === 0 ? (
          <CustomEmptyState
            icon={<Filter />}
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
                <div className="aspect-square relative">
                  {file.file_type === 'image' || file.file_type?.startsWith('image/') ? (
                    <img 
                      src={file.file_url} 
                      alt={file.original_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <PlayCircle className="h-12 w-12 text-primary" />
                    </div>
                  )}
                  
                  {/* Overlay with info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        {getEntryTypeLabel(file.site_log.entry_type)}
                      </span>
                    </div>
                    
                    <div className="text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={file.site_log.creator.avatar_url || '/placeholder.svg'}
                          alt={file.site_log.creator.full_name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="text-xs truncate">{file.site_log.creator.full_name}</span>
                      </div>
                      <p className="text-xs">
                        {format(new Date(file.site_log.log_date), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedFile && (
          <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
            <DialogContent className="max-w-4xl h-[90vh] p-0">
              <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedFile.site_log.creator.avatar_url || '/placeholder.svg'}
                      alt={selectedFile.site_log.creator.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{selectedFile.site_log.creator.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedFile.site_log.log_date), 'dd MMM yyyy', { locale: es })} • {getEntryTypeLabel(selectedFile.site_log.entry_type)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => downloadFile(selectedFile)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Media content */}
                <div className="flex-1 flex items-center justify-center p-4 bg-black/5">
                  {selectedFile.file_type === 'image' || selectedFile.file_type?.startsWith('image/') ? (
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

                {/* Navigation */}
                {filteredFiles.length > 1 && (
                  <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImage('prev');
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImage('next');
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}