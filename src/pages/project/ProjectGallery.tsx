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

import { useToast } from '@/hooks/use-toast';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/ImageLightbox';
import { ActionBarDesktopRow } from '@/components/layout/desktop/ActionBarDesktopRow';
import { 
  Images, 
  Filter, 
  Search,
  FilterX,
  Plus,
  Download, 
  PlayCircle, 
  Edit,
  Trash2,
  FolderOpen,
  X,
  Play
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
  description?: string;
  project_id?: string;
  project_name?: string;
  visibility: 'organization' | 'project';
}

export default function ProjectGallery() {
  const { data: userData } = useCurrentUser();
  const storedProjectId = userData?.preferences?.last_project_id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useGlobalModalStore();
  const { setSidebarContext } = useNavigationStore();
  const [location] = useLocation();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('Todo');

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
        .from('project_media')
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
          file_size,
          visibility,
          created_by,
          projects (
            id,
            name
          )
        `)
        .eq('organization_id', userData.organization.id);

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
            ? supabase.storage.from('project-media').getPublicUrl(file.file_url).data.publicUrl
            : '';

        return {
          id: file.id,
          file_url: publicUrl,
          file_type: file.file_type,
          file_name: file.file_name || 'Sin nombre',
          original_name: file.file_name || 'Sin nombre',
          title: file.file_name || 'Sin título',
          description: file.description || '',
          entry_type: 'registro_general', // Default value since we don't have site_logs relation anymore
          created_at: file.created_at,
          project_id: file.project_id,
          project_name: file.projects?.name || 'Proyecto sin nombre',
          file_size: file.file_size,
          visibility: file.visibility,
          created_by: file.created_by
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
    if (fileTypeFilter !== 'Todo') {
      filtered = filtered.filter(file => 
        fileTypeFilter === 'Imágenes'
          ? file.file_type === 'image' || file.file_type?.startsWith('image/')
          : file.file_type === 'video' || file.file_type?.startsWith('video/')
      );
    }

    return filtered;
  }, [galleryFiles, searchTerm, fileTypeFilter]);

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
        .from('project_media')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([fileData.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_media')
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



  if (isLoading) {
    return (
      <Layout
        headerProps={{
          icon: Images,
          title: "Galería",
          actionButton: {
            label: 'Subir Archivo',
            icon: Plus,
            onClick: () => openModal('gallery')
          }
        }}
      >
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
      <Layout
        headerProps={{
          icon: Images,
          title: "Galería",
          actionButton: {
            label: 'Subir Archivo',
            icon: Plus,
            onClick: () => openModal('gallery')
          }
        }}
      >
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
      <Layout
        headerProps={{
          icon: Images,
          title: "Galería",
          actionButton: {
            label: 'Subir Archivo',
            icon: Plus,
            onClick: () => openModal('gallery')
          }
        }}
      >
        <div className="space-y-6">
          <EmptyState
            icon={<Images className="w-12 h-12 text-muted-foreground" />}
            title="Galería vacía"
            description={projectId ? 
              "No hay archivos multimedia en este proyecto. Sube las primeras fotos o videos para comenzar." :
              "No hay archivos multimedia en ningún proyecto de la organización."
            }
            action={
              <Button onClick={() => openModal('gallery')}>
                <Plus className="w-4 h-4 mr-2" />
                Subir Archivo
              </Button>
            }
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      headerProps={{
        icon: Images,
        title: "Galería",
        actionButton: {
          label: 'Subir Archivo',
          icon: Plus,
          onClick: () => openModal('gallery')
        }
      }}
    >
      <div className="space-y-6">
        {/* Filter Buttons using SelectableGhostButton style */}
        {filteredFiles.length > 0 && (
          <div className="hidden md:flex flex-col rounded-lg border border-[var(--card-border)] mb-6 shadow-lg" style={{ backgroundColor: "var(--card-bg)" }}>
            <div className="flex items-center justify-between px-4 py-3">
              {/* Filter buttons on the left - Ghost buttons that look pressed when active */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFileTypeFilter('Todo')}
                  className={fileTypeFilter === 'Todo' 
                    ? "h-8 px-3 text-xs bg-[var(--button-ghost-hover-bg)] text-[var(--button-ghost-hover-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)]"
                    : "h-8 px-3 text-xs"
                  }
                >
                  Todo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFileTypeFilter('Imágenes')}
                  className={fileTypeFilter === 'Imágenes' 
                    ? "h-8 px-3 text-xs bg-[var(--button-ghost-hover-bg)] text-[var(--button-ghost-hover-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)]"
                    : "h-8 px-3 text-xs"
                  }
                >
                  Imágenes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFileTypeFilter('Videos')}
                  className={fileTypeFilter === 'Videos' 
                    ? "h-8 px-3 text-xs bg-[var(--button-ghost-hover-bg)] text-[var(--button-ghost-hover-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)]"
                    : "h-8 px-3 text-xs"
                  }
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log("Filters clicked - TODO: Implement filters modal");
                  }}
                  className="h-8 px-3 text-xs"
                >
                  <Filter className="mr-1 h-3 w-3" />
                  Filtros
                </Button>
                {(searchTerm || fileTypeFilter !== 'Todo') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFileTypeFilter('Todo');
                    }}
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

        {/* Results Summary */}
        {filteredFiles.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredFiles.length} archivo{filteredFiles.length !== 1 ? 's' : ''} encontrado{filteredFiles.length !== 1 ? 's' : ''}
            </span>
            {!projectId && (
              <span>
                Mostrando archivos de todos los proyectos
              </span>
            )}
          </div>
        )}

        {/* Gallery Grid */}
        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="group overflow-hidden">
                <div className="aspect-square relative">
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
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-gray-400" />
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(file);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* File info */}
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate" title={file.file_name}>
                    {file.file_name}
                  </h3>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{file.file_type === 'image' ? 'Imagen' : file.file_type === 'video' ? 'Video' : 'Archivo'}</span>
                    <span>{format(new Date(file.created_at), 'dd/MM/yy', { locale: es })}</span>
                  </div>
                  {!projectId && file.project_name && (
                    <div className="mt-1 text-xs text-muted-foreground truncate">
                      {file.project_name}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search className="w-12 h-12 text-muted-foreground" />}
            title="Sin resultados"
            description="No se encontraron archivos con los filtros aplicados. Intenta cambiar los criterios de búsqueda."
            action={
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFileTypeFilter('all');
                }}
              >
                <FilterX className="w-4 h-4 mr-2" />
                Limpiar filtros
              </Button>
            }
          />
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={imageUrls}
        isOpen={isLightboxOpen}
        currentIndex={currentIndex}
        onClose={closeLightbox}
      />
    </Layout>
  );
}