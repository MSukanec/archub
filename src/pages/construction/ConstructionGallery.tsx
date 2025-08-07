import { useState, useMemo, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/desktop/Layout';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
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

export default function ConstructionGallery() {
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

  // Set sidebar context based on current route
  useEffect(() => {
    if (location.includes('/project/')) {
      setSidebarContext('project');
    } else if (location.includes('/construction/')) {
      setSidebarContext('construction');
    }
  }, [location, setSidebarContext]);

  // Query to check if stored project belongs to current organization
  const { data: currentProject } = useQuery({
    queryKey: ['currentProject', storedProjectId, userData?.preferences?.last_organization_id],
    queryFn: async () => {
      if (!storedProjectId || !userData?.preferences?.last_organization_id || !supabase) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, organization_id')
        .eq('id', storedProjectId)
        .eq('organization_id', userData.preferences.last_organization_id)
        .single();
      
      if (error) {
        console.log('Project not found in current organization:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!storedProjectId && !!userData?.preferences?.last_organization_id
  });

  // Use project ID only if the project belongs to current organization
  const projectId = currentProject?.id || null;

  // Gallery files query
  const { data: galleryFiles = [], isLoading, error } = useQuery({
    queryKey: ['galleryFiles', projectId, userData?.preferences?.last_organization_id],
    queryFn: async () => {
      console.log('Fetching gallery files for project:', projectId);
      console.log('Organization ID:', userData?.preferences?.last_organization_id);
      
      if (!supabase || !userData?.preferences?.last_organization_id) {
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
        .eq('organization_id', userData.preferences.last_organization_id);

      // If no project selected (GENERAL mode), show all projects' images
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
          id: file.id,
          file_url: publicUrl,
          file_type: file.file_type,
          file_name: file.file_name || 'Sin nombre',
          original_name: file.file_name || 'Sin nombre',
          title: file.file_name || 'Sin título',
          description: file.description || '',
          entry_type: file.site_logs?.entry_type || 'registro_general',
          created_at: file.created_at,
          project_id: file.project_id,
          project_name: file.projects?.name || 'Proyecto sin nombre',
          site_log: file.site_log_id ? {
            id: file.site_log_id,
            log_date: file.site_logs?.log_date || file.created_at,
            entry_type: file.site_logs?.entry_type || 'registro_general',
            creator: {
              id: file.site_logs?.created_by || '',
              full_name: userData?.user?.full_name || 'Usuario',
              avatar_url: userData?.user?.avatar_url || ''
            }
          } : undefined
        };
      }) || [];
    },
    enabled: !!userData?.preferences?.last_organization_id
  });

  // Filter files
  const filteredFiles = useMemo(() => {
    let filtered = galleryFiles;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // File type filter
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(file => 
        fileTypeFilter === 'image'
          ? file.file_type === 'image' || file.file_type?.startsWith('image/')
          : file.file_type === 'video' || file.file_type?.startsWith('video/')
      );
    }

    // Entry type filter
    if (entryTypeFilter !== 'all') {
      filtered = filtered.filter(file => file.entry_type === entryTypeFilter);
    }

    return filtered;
  }, [galleryFiles, searchTerm, fileTypeFilter, entryTypeFilter]);

  // Lightbox setup - usar TODAS las imágenes de galleryFiles, no solo las filtradas
  const imageUrls = useMemo(() => 
    galleryFiles
      .filter(file => file.file_type === 'image' || file.file_type?.startsWith('image/'))
      .map(file => file.file_url), 
    [galleryFiles]
  );
  
  const { 
    isOpen: isLightboxOpen, 
    currentIndex, 
    openLightbox, 
    closeLightbox
  } = useImageLightbox(imageUrls);

  // Delete mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get file info first
      const { data: fileData, error: fetchError } = await supabase
        .from('site_log_files')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('site-log-files')
        .remove([fileData.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('site_log_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Archivo eliminado correctamente',
      });
      
      // Invalidar caché con todas las claves posibles
      queryClient.invalidateQueries({ queryKey: ['galleryFiles'] });
      queryClient.removeQueries({ queryKey: ['galleryFiles'] });
      queryClient.refetchQueries({ queryKey: ['galleryFiles'] });
      
      // Cerrar lightbox si estaba abierto
      closeLightbox();
    },
    onError: (error) => {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el archivo',
        variant: 'destructive',
      });
    },
  });

  // Mobile Action Bar setup
  useEffect(() => {
    if (isMobile) {
      setActions({
        slot2: {
          id: 'search',
          icon: <Search className="h-5 w-5" />,
          label: 'Buscar',
          onClick: () => {
            const searchInput = document.getElementById('gallery-search');
            searchInput?.focus();
          },
        },
        slot3: {
          id: 'new-file',
          icon: <Plus className="h-6 w-6" />,
          label: 'Subir',
          onClick: () => openModal('gallery'),
        },
        slot4: {
          id: 'filters',
          icon: <Filter className="h-5 w-5" />,
          label: 'Filtros',
          onClick: () => {
            const filtersContainer = document.getElementById('gallery-filters');
            if (filtersContainer) {
              filtersContainer.style.display = filtersContainer.style.display === 'none' ? 'block' : 'none';
            }
          },
        },
        slot5: {
          id: 'clear-filters',
          icon: <FilterX className="h-5 w-5" />,
          label: 'Limpiar',
          onClick: () => {
            setSearchTerm('');
            setFileTypeFilter('all');
            setEntryTypeFilter('all');
          },
        },
      });
      setShowActionBar(true);

      return () => {
        setShowActionBar(false);
      };
    }
  }, [isMobile, setActions, setShowActionBar]);

  // Functions
  const handleImageClick = (file: GalleryFile) => {
    if (file.file_type === 'image' || file.file_type?.startsWith('image/')) {
      const imageIndex = imageUrls.indexOf(file.file_url);
      if (imageIndex !== -1) {
        openLightbox(imageIndex);
      }
    }
  };

  const handleEdit = (file: GalleryFile) => {
    setEditingFile(file);
    openModal('gallery', { editingFile: file });
  };

  const handleDelete = (file: GalleryFile) => {
    openModal('delete-confirmation', {
      mode: 'simple',
      title: 'Eliminar archivo',
      description: `¿Estás seguro de que quieres eliminar "${file.file_name}"? Esta acción no se puede deshacer.`,
      itemName: file.file_name,
      destructiveActionText: 'Eliminar archivo',
      onConfirm: () => deleteFileMutation.mutate(file.id),
      isLoading: deleteFileMutation.isPending
    });
  };

  const downloadFile = (file: GalleryFile) => {
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.file_name;
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
          {/* ActionBar */}
          <ActionBarDesktop
            title={projectId ? "Galería Multimedia del Proyecto" : "Galería Multimedia - Todos los Proyectos"}
            icon={<Images className="w-5 h-5" />}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            primaryActionLabel="Subir Archivo"
            onPrimaryActionClick={() => openModal('gallery')}
            customFilters={
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    Filtrar por tipo de archivo
                  </Label>
                  <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Todos los archivos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los archivos</SelectItem>
                      <SelectItem value="image">Solo imágenes</SelectItem>
                      <SelectItem value="video">Solo videos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    Filtrar por tipo de entrada
                  </Label>
                  <Select value={entryTypeFilter} onValueChange={setEntryTypeFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="avance_de_obra">Avance de Obra</SelectItem>
                      <SelectItem value="visita_tecnica">Visita Técnica</SelectItem>
                      <SelectItem value="problema_detectado">Problema Detectado</SelectItem>
                      <SelectItem value="pedido_material">Pedido Material</SelectItem>
                      <SelectItem value="nota_climatica">Nota Climática</SelectItem>
                      <SelectItem value="decision">Decisión</SelectItem>
                      <SelectItem value="inspeccion">Inspección</SelectItem>
                      <SelectItem value="foto_diaria">Foto Diaria</SelectItem>
                      <SelectItem value="registro_general">Registro General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
            features={[
              {
                icon: <Camera className="w-4 h-4" />,
                title: "Fotos y Videos",
                description: "Captura y organiza fotos y videos del progreso de la obra directamente desde el móvil."
              },
              {
                icon: <FolderOpen className="w-4 h-4" />,
                title: "Organización Automática",
                description: "Los archivos se organizan automáticamente por fecha y tipo de entrada para fácil navegación."
              },
              {
                icon: <Calendar className="w-4 h-4" />,
                title: "Histórico Visual",
                description: "Mantén un registro visual completo del progreso de la obra con fechas y descripciones."
              },
              {
                icon: <Eye className="w-4 h-4" />,
                title: "Visor Integrado",
                description: "Visualiza imágenes y reproduce videos directamente en la aplicación con navegación intuitiva."
              }
            ]}
          />

          {/* Feature Introduction - Mobile Only */}
          <FeatureIntroduction
            title="Galería Multimedia"
            icon={<Images className="w-6 h-6" />}
            features={[
              {
                icon: <Camera className="w-4 h-4" />,
                title: "Fotos y Videos",
                description: "Captura y organiza fotos y videos del progreso de la obra directamente desde el móvil."
              },
              {
                icon: <FolderOpen className="w-4 h-4" />,
                title: "Organización Automática",
                description: "Los archivos se organizan automáticamente por fecha y tipo de entrada para fácil navegación."
              },
              {
                icon: <Calendar className="w-4 h-4" />,
                title: "Histórico Visual",
                description: "Mantén un registro visual completo del progreso de la obra con fechas y descripciones."
              },
              {
                icon: <Eye className="w-4 h-4" />,
                title: "Visor Integrado",
                description: "Visualiza imágenes y reproduce videos directamente en la aplicación con navegación intuitiva."
              }
            ]}
            className="md:hidden"
          />

          <EmptyState
            icon={<Images />}
            title="No hay archivos en la galería"
            description="Sube tu primer archivo para comenzar"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* ActionBar */}
        <ActionBarDesktop
          title={projectId ? "Galería Multimedia del Proyecto" : "Galería Multimedia - Todos los Proyectos"}
          icon={<Images className="w-5 h-5" />}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          primaryActionLabel="Subir Archivo"
          onPrimaryActionClick={() => openModal('gallery')}
          customFilters={
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Filtrar por tipo de archivo
                </Label>
                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todos los archivos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los archivos</SelectItem>
                    <SelectItem value="image">Solo imágenes</SelectItem>
                    <SelectItem value="video">Solo videos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Filtrar por tipo de entrada
                </Label>
                <Select value={entryTypeFilter} onValueChange={setEntryTypeFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="avance_de_obra">Avance de Obra</SelectItem>
                    <SelectItem value="visita_tecnica">Visita Técnica</SelectItem>
                    <SelectItem value="problema_detectado">Problema Detectado</SelectItem>
                    <SelectItem value="pedido_material">Pedido Material</SelectItem>
                    <SelectItem value="nota_climatica">Nota Climática</SelectItem>
                    <SelectItem value="decision">Decisión</SelectItem>
                    <SelectItem value="inspeccion">Inspección</SelectItem>
                    <SelectItem value="foto_diaria">Foto Diaria</SelectItem>
                    <SelectItem value="registro_general">Registro General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          features={[
            {
              icon: <Camera className="w-4 h-4" />,
              title: "Fotos y Videos",
              description: "Captura y organiza fotos y videos del progreso de la obra directamente desde el móvil."
            },
            {
              icon: <FolderOpen className="w-4 h-4" />,
              title: "Organización Automática",
              description: "Los archivos se organizan automáticamente por fecha y tipo de entrada para fácil navegación."
            },
            {
              icon: <Calendar className="w-4 h-4" />,
              title: "Histórico Visual",
              description: "Mantén un registro visual completo del progreso de la obra con fechas y descripciones."
            },
            {
              icon: <Eye className="w-4 h-4" />,
              title: "Visor Integrado",
              description: "Visualiza imágenes y reproduce videos directamente en la aplicación con navegación intuitiva."
            }
          ]}
        />

        {/* Feature Introduction - Mobile Only */}
        <FeatureIntroduction
          title="Galería Multimedia"
          icon={<Images className="w-6 h-6" />}
          features={[
            {
              icon: <Camera className="w-4 h-4" />,
              title: "Fotos y Videos",
              description: "Captura y organiza fotos y videos del progreso de la obra directamente desde el móvil."
            },
            {
              icon: <FolderOpen className="w-4 h-4" />,
              title: "Organización Automática",
              description: "Los archivos se organizan automáticamente por fecha y tipo de entrada para fácil navegación."
            },
            {
              icon: <Calendar className="w-4 h-4" />,
              title: "Histórico Visual",
              description: "Mantén un registro visual completo del progreso de la obra con fechas y descripciones."
            },
            {
              icon: <Eye className="w-4 h-4" />,
              title: "Visor Integrado",
              description: "Visualiza imágenes y reproduce videos directamente en la aplicación con navegación intuitiva."
            }
          ]}
          className="md:hidden"
        />

        {/* Gallery Grid */}
        {filteredFiles.length === 0 ? (
          <EmptyState
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
                onClick={() => handleImageClick(file)}
              >
                <div className="aspect-square relative">
                  {file.file_type === 'image' || file.file_type?.startsWith('image/') ? (
                    <img 
                      src={file.file_url} 
                      alt={file.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <PlayCircle className="h-12 w-12 text-primary" />
                    </div>
                  )}
                  
                  {/* Overlay with info and actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded block">
                          {getEntryTypeLabel(file.entry_type || 'registro_general')}
                        </span>
                        {!projectId && file.project_name && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded block">
                            {file.project_name}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 bg-white/20 hover:bg-white/40"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(file);
                          }}
                        >
                          <Edit className="h-3 w-3 text-white" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 bg-white/20 hover:bg-white/40"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-white">
                      <p className="text-xs font-medium truncate">{file.title}</p>
                      <p className="text-xs">
                        {format(new Date(file.created_at), 'dd MMM yyyy', { locale: es })}
                      </p>
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
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
      />






    </Layout>
  );
}