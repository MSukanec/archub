import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DocumentExplorer } from '@/components/ui-custom/DocumentExplorer';
import { DocumentInfo } from '@/components/ui-custom/DocumentInfo';
import { DocumentPreviewModal } from '@/components/modal/modals/project/DocumentPreviewModal';
import { UnifiedViewer } from '@/components/viewers/UnifiedViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Gallery } from '@/components/ui-custom/Gallery';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { cn } from '@/lib/utils';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useDesignDocuments } from '@/hooks/use-design-documents';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { FileText, FolderPlus, File, Image, Clock, Download, ExternalLink, Upload, Images, Plus, BookOpen, FolderOpen } from 'lucide-react';
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

export default function Library() {
  const { openModal } = useGlobalModalStore();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('documentation');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const storedProjectId = userData?.preferences?.last_project_id;

  // Documentation: Get recent documents for history
  const { data: allDocuments } = useDesignDocuments();
  const recentDocuments = allDocuments?.slice(0, 10) || [];

  // Auto-select the most recent document when data loads
  useEffect(() => {
    if (recentDocuments.length > 0 && !selectedDocument && activeTab === 'documentation') {
      setSelectedDocument(recentDocuments[0]);
    }
  }, [recentDocuments, selectedDocument, activeTab]);

  // Gallery: Query to check if stored project belongs to current organization
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
  const { data: galleryFiles = [], isLoading: galleryLoading, error: galleryError } = useQuery({
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
            name
          )
        `)
        .eq('organization_id', userData.organization.id);

      // Filter by project if we have a specific project ID
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
          entry_type: 'registro_general',
          created_at: file.created_at,
          project_id: file.project_id,
          project_name: file.projects?.name || 'Proyecto sin nombre',
          file_size: file.file_size,
          visibility: file.visibility as 'organization' | 'project',
          created_by: file.created_by,
          site_log_id: file.site_log_id
        };
      }) || [];
    },
    enabled: !!userData?.preferences?.last_organization_id && activeTab === 'gallery'
  });

  // Delete mutation for gallery
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
      queryClient.invalidateQueries({ queryKey: ['galleryFiles'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el archivo',
        variant: 'destructive',
      });
      console.error('Delete error:', error);
    },
  });

  // Tabs configuration
  const tabs = [
    {
      id: 'documentation',
      label: 'Documentación',
      isActive: activeTab === 'documentation'
    },
    {
      id: 'gallery',
      label: 'Galería',
      isActive: activeTab === 'gallery'
    }
  ];

  const headerProps = {
    icon: BookOpen,
    title: "Biblioteca",
    tabs,
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actionButton: activeTab === 'documentation' ? {
      label: "Subir Documentos",
      icon: Upload,
      onClick: () => {
        console.log('Opening document-upload modal from Library');
        openModal('document-upload', {});
      }
    } : {
      label: 'Subir Archivo',
      icon: Plus,
      onClick: () => openModal('gallery', {})
    }
  };

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
    setIsPreviewOpen(false);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedDocument(null);
  };

  const handleExpandPdf = () => {
    setIsPreviewOpen(true);
  };

  // Gallery handlers
  const handleEdit = (file: GalleryFile) => {
    openModal('gallery', { fileId: file.id });
  };

  const handleDownload = (file: GalleryFile) => {
    if (file.file_url) {
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = (file: GalleryFile) => {
    deleteFileMutation.mutate(file.id);
  };

  // Helper functions
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return FileText;
    if (fileType.startsWith('image/')) return Image;
    if (fileType === 'application/pdf') return FileText;
    return File;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'aprobado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'en_revision': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'rechazado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'aprobado': return 'Aprobado';
      case 'pendiente': return 'Pendiente';
      case 'en_revision': return 'En Revisión';
      case 'rechazado': return 'Rechazado';
      default: return 'Sin estado';
    }
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      {/* Documentation Tab */}
      {activeTab === 'documentation' && (
        <>
          {/* Desktop: Vertical Layout */}
          <div className="hidden lg:flex flex-col h-full gap-4">
            {/* Top: Document Viewer and Info */}
            <div className="flex-1 flex gap-4">
              {/* Left: Document Viewer (2/3) */}
              <div className="w-2/3 min-w-0">
              <div 
                className="rounded-lg overflow-hidden border-2 border-dashed h-full"
                style={{ borderColor: 'var(--accent)' }}
              >
                {selectedDocument ? (
                  <UnifiedViewer 
                    bucket="design-documents"
                    path={selectedDocument.file_path}
                    fileName={selectedDocument.file_name}
                    fileType={selectedDocument.file_type}
                    className="w-full"
                    onExpand={handleExpandPdf}
                    height={520}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                      <h3 className="text-2xl font-light mb-3">Selecciona un documento</h3>
                      <p className="text-muted-foreground text-lg">
                        Haz clic en cualquier archivo del explorador para verlo aquí
                      </p>
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Right: Document Info (1/3) */}
              <div className="w-1/3">
                <DocumentInfo 
                  document={selectedDocument}
                  onDownload={() => selectedDocument && window.open(selectedDocument.file_url, '_blank')}
                  onShare={() => {/* TODO: Implement share */}}
                  onEdit={() => {/* TODO: Implement edit */}}
                  onDelete={() => {/* TODO: Implement delete */}}
                />
              </div>
            </div>

            {/* Bottom: Two Cards Side by Side */}
            <div className="flex gap-4 h-80">
              {/* Left: Document Explorer (2/3) */}
              <div className="w-2/3">
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex-shrink-0 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">Explorador de Documentos</CardTitle>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Navega por las carpetas y archivos de documentación
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 min-h-0">
                    <DocumentExplorer onDocumentSelect={handleDocumentSelect} />
                  </CardContent>
                </Card>
              </div>

              {/* Right: Recent Files History (1/3) */}
              <div className="w-1/3">
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex-shrink-0 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">Historial</CardTitle>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Accede rápidamente a los últimos documentos visualizados
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-1">
                        {recentDocuments.length > 0 ? (
                          recentDocuments.map((doc) => (
                            <Button
                              key={doc.id}
                              variant={selectedDocument?.id === doc.id ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() => handleDocumentSelect(doc)}
                              className={cn(
                                "h-8 px-3 text-xs font-normal flex items-center justify-between w-full text-left",
                                selectedDocument?.id === doc.id ? "button-secondary-pressed hover:bg-secondary" : ""
                              )}
                            >
                              <span className="text-sm font-medium truncate flex-1 pr-2 text-left">{doc.file_name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {format(new Date(doc.created_at), 'dd MMM', { locale: es })}
                              </span>
                            </Button>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">
                              Sin documentos recientes
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Mobile: Single Column Layout */}
          <div className="lg:hidden">
            <DocumentExplorer onDocumentSelect={handleDocumentSelect} />
            
            {/* Document Preview Modal for Mobile */}
            <DocumentPreviewModal 
              document={selectedDocument}
              isOpen={isPreviewOpen}
              onClose={handleClosePreview}
            />
          </div>

          {/* Document Preview Modal for Desktop (expand button) */}
          <div className="hidden lg:block">
            <DocumentPreviewModal 
              document={selectedDocument}
              isOpen={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
            />
          </div>
        </>
      )}

      {/* Gallery Tab */}
      {activeTab === 'gallery' && (
        <>
          {galleryLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando galería...</p>
              </div>
            </div>
          ) : galleryError ? (
            <EmptyState
              icon={Images}
              title="Error al cargar la galería"
              description="Hubo un problema al cargar los archivos de la galería"
              action={
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['galleryFiles'] })}>
                  Reintentar
                </Button>
              }
            />
          ) : galleryFiles.length === 0 ? (
            <EmptyState
              icon={Images}
              title="No hay archivos en la galería"
              description="Sube imágenes y videos para comenzar a construir tu galería de proyecto"
              action={
                <Button onClick={() => openModal('gallery', {})}>
                  <Plus className="w-4 h-4 mr-2" />
                  Subir Archivo
                </Button>
              }
            />
          ) : (
            <Gallery
              files={galleryFiles}
              onEdit={handleEdit}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          )}
        </>
      )}
    </Layout>
  );
}