import { useState, useMemo, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/desktop/Layout';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext';
import { useMobile } from '@/hooks/use-mobile';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/ImageLightbox';
import { 
  Images, 
  Filter, 
  Search,
  FilterX,
  Plus,
  Download, 
  ChevronLeft, 
  ChevronRight, 
  PlayCircle, 
  X,
  Edit,
  Trash2,
  Camera,
  FolderOpen,
  Calendar,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Gallery file interface
interface GalleryFile {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  created_at: string;
  site_log_id?: string;
  description?: string;
  project_id?: string;
  project_name?: string;
}

export default function ProjectGallery() {
  const { data: userData } = useCurrentUser();
  const storedProjectId = userData?.preferences?.last_project_id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setActions, setShowActionBar } = useMobileActionBar();
  const isMobile = useMobile();
  const { openModal } = useGlobalModalStore();
  const { setSidebarContext } = useNavigationStore();
  const [location] = useLocation();
  
  // Modal states  
  const [editingFile, setEditingFile] = useState<GalleryFile | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [entryTypeFilter, setEntryTypeFilter] = useState<string>('all');

  // Set sidebar context for project
  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  // Query to check if stored project belongs to current organization
  const { data: currentProject } = useQuery({
    queryKey: ['currentProject', storedProjectId, userData?.organization?.id],
    queryFn: async () => {
      if (!storedProjectId || !userData?.organization?.id || !supabase) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, organization_id')
        .eq('id', storedProjectId)
        .eq('organization_id', userData.organization.id)
        .single();
      
      if (error) {
        console.log('Project not found in current organization:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!storedProjectId && !!userData?.organization?.id
  });

  // Use project ID only if the project belongs to current organization
  const projectId = currentProject?.id || null;

  // Gallery files query
  const { data: galleryFiles = [], isLoading, error } = useQuery({
    queryKey: ['galleryFiles', projectId, userData?.organization?.id],
    queryFn: async () => {
      console.log('Fetching gallery files for project:', projectId);
      console.log('Organization ID:', userData?.organization?.id);
      
      if (!supabase || !userData?.organization?.id) {
        throw new Error('Missing required data');
      }

      let query = supabase
        .from('site_log_files')
        .select(`
          id,
          file_url,
          file_type,
          file_name,
          created_at,
          site_log_id,
          description,
          project_id,
          organization_id,
          site_logs (
            id,
            project_id,
            organization_id,
            entry_type,
            log_date,
            created_by
          ),
          projects (
            id,
            name
          )
        `)
        .eq('organization_id', userData.organization.id);

      // If project selected, show only that project's images
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gallery files:', error);
        throw error;
      }

      return data?.map((file: any) => {
        // Generate proper public URL from Supabase Storage
        const publicUrl = file.file_url?.startsWith('http') 
          ? file.file_url 
          : file.file_url 
            ? supabase.storage.from('site-log-files').getPublicUrl(file.file_url).data.publicUrl
            : '';

        return {
          ...file,
          file_url: publicUrl,
          project_name: file.projects?.name || 'Sin proyecto'
        };
      }) || [];
    },
    enabled: !!userData?.organization?.id
  });

  // Filter files based on search and filter criteria
  const filteredFiles = useMemo(() => {
    let filtered = galleryFiles;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(file => 
        file.file_name?.toLowerCase().includes(searchLower) ||
        file.description?.toLowerCase().includes(searchLower) ||
        file.project_name?.toLowerCase().includes(searchLower)
      );
    }

    // File type filter
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(file => file.file_type === fileTypeFilter);
    }

    // Entry type filter
    if (entryTypeFilter !== 'all') {
      filtered = filtered.filter(file => 
        file.site_logs?.[0]?.entry_type === entryTypeFilter
      );
    }

    return filtered;
  }, [galleryFiles, searchTerm, fileTypeFilter, entryTypeFilter]);

  // Get image URLs for lightbox
  const imageUrls = useMemo(() => {
    return filteredFiles
      .filter(file => file.file_type === 'image')
      .map(file => file.file_url);
  }, [filteredFiles]);

  // Initialize lightbox
  const { currentIndex, isOpen, openLightbox, closeLightbox } = useImageLightbox(imageUrls);

  // Mobile action bar setup
  useEffect(() => {
    if (isMobile) {
      setActions([
        {
          icon: <Plus className="h-4 w-4" />,
          label: 'Subir',
          onClick: () => openModal('gallery-form', {}),
          variant: 'default'
        }
      ]);
      setShowActionBar(true);
    }

    return () => {
      if (isMobile) {
        setShowActionBar(false);
      }
    };
  }, [isMobile, setActions, setShowActionBar, openModal]);

  // Handle image click for lightbox
  const handleImageClick = (file: GalleryFile) => {
    if (file.file_type === 'image') {
      const imageIndex = imageUrls.findIndex(url => url === file.file_url);
      if (imageIndex !== -1) {
        openLightbox(imageIndex);
      }
    }
  };

  // Handle file deletion
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase
        .from('site_log_files')
        .delete()
        .eq('id', fileId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryFiles'] });
      toast({ title: 'Archivo eliminado correctamente' });
    },
    onError: (error: any) => {
      console.error('Error deleting file:', error);
      toast({ 
        title: 'Error al eliminar archivo',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Handle file download
  const handleDownload = async (file: GalleryFile) => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name || `archivo-${file.id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error al descargar archivo',
        description: 'No se pudo descargar el archivo',
        variant: 'destructive'
      });
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setFileTypeFilter('all');
    setEntryTypeFilter('all');
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout 
        headerProps={{
          title: 'Galería',
          breadcrumbs: [
            { label: 'Proyecto', href: '/organization/project/dashboard' },
            { label: 'Galería', href: '/organization/project/gallery' }
          ]
        }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando galería...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout 
        headerProps={{
          title: 'Galería',
          breadcrumbs: [
            { label: 'Proyecto', href: '/organization/project/dashboard' },
            { label: 'Galería', href: '/organization/project/gallery' }
          ]
        }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Error al cargar la galería</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      headerProps={{
        title: 'Galería',
        breadcrumbs: [
          { label: 'Proyecto', href: '/organization/project/dashboard' },
          { label: 'Galería', href: '/organization/project/gallery' }
        ],
        actions: !isMobile ? [
          {
            label: 'Subir Archivo',
            onClick: () => openModal('gallery-form', {}),
            variant: 'default',
            icon: <Plus className="h-4 w-4" />
          }
        ] : undefined
      }}
    >
      <div className="space-y-6">
        {/* Filters Section - Mobile Optimized */}
        <Card className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filtros</h3>
              {(searchTerm || fileTypeFilter !== 'all' || entryTypeFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-8 px-3"
                >
                  <FilterX className="h-3 w-3 mr-2" />
                  Limpiar
                </Button>
              )}
            </div>
            
            {/* Mobile-first responsive layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Buscar archivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              {/* File Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de archivo</Label>
                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="image">Imágenes</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Entry Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de entrada</Label>
                <Select value={entryTypeFilter} onValueChange={setEntryTypeFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="photo_gallery">Galería de fotos</SelectItem>
                    <SelectItem value="material_delivery">Entrega de materiales</SelectItem>
                    <SelectItem value="progress_report">Reporte de progreso</SelectItem>
                    <SelectItem value="incident_report">Reporte de incidente</SelectItem>
                    <SelectItem value="work_log">Bitácora de trabajo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
              <div className="flex items-end">
                <div className="text-sm text-muted-foreground">
                  {filteredFiles.length} archivo{filteredFiles.length !== 1 ? 's' : ''} encontrado{filteredFiles.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Gallery Grid */}
        {filteredFiles.length === 0 ? (
          <EmptyState
            icon={<Images className="h-12 w-12" />}
            title="No hay archivos en la galería"
            description="Sube tu primer archivo para comenzar"
            action={
              <Button 
                onClick={() => openModal('gallery-form', {})}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Subir Archivo
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  {/* File Preview */}
                  <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                    {file.file_type === 'image' ? (
                      <img
                        src={file.file_url}
                        alt={file.file_name}
                        className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                        onClick={() => handleImageClick(file)}
                        loading="lazy"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center bg-muted cursor-pointer"
                        onClick={() => handleDownload(file)}
                      >
                        <PlayCircle className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* File type badge */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs font-medium bg-black/70 text-white rounded">
                        {file.file_type === 'image' ? 'IMG' : 'VIDEO'}
                      </span>
                    </div>

                    {/* Actions overlay - visible on hover or always on mobile */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(file)}
                        className="h-8 w-8 p-0"
                        title="Descargar"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      {file.file_type === 'image' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleImageClick(file)}
                          className="h-8 w-8 p-0"
                          title="Ver en pantalla completa"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingFile(file)}
                        className="h-8 w-8 p-0"
                        title="Editar"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteFileMutation.mutate(file.id)}
                        disabled={deleteFileMutation.isPending}
                        className="h-8 w-8 p-0"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="p-4">
                    <h4 className="font-medium text-sm mb-2 truncate" title={file.file_name}>
                      {file.file_name}
                    </h4>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {file.project_name && (
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          <span className="truncate">{file.project_name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(file.created_at), 'dd MMM yyyy', { locale: es })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={imageUrls}
        currentIndex={currentIndex}
        isOpen={isOpen}
        onClose={closeLightbox}
      />
    </Layout>
  );
}