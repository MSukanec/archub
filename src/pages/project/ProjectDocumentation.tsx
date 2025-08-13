import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DocumentExplorer } from '@/components/ui-custom/DocumentExplorer';
import { DocumentInfo } from '@/components/ui-custom/DocumentInfo';
import { DocumentPreviewModal } from '@/components/modal/modals/project/DocumentPreviewModal';
import { UnifiedViewer } from '@/components/viewers/UnifiedViewer';
import { PdfViewer } from '@/components/viewers/PdfViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useDesignDocuments } from '@/hooks/use-design-documents';
import { FileText, FolderPlus, File, Image, Clock, Download, ExternalLink, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProjectDocumentation() {
  const { openModal } = useGlobalModalStore();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Get recent documents for history
  const { data: allDocuments } = useDesignDocuments();
  const recentDocuments = allDocuments?.slice(0, 10) || [];

  // Auto-select the most recent document when data loads
  useEffect(() => {
    if (recentDocuments.length > 0 && !selectedDocument) {
      setSelectedDocument(recentDocuments[0]);
    }
  }, [recentDocuments, selectedDocument]);

  const headerProps = {
    icon: FileText,
    title: "Documentación",
    actionButton: {
      label: "Subir Documentos",
      icon: Upload,
      onClick: () => {
        console.log('Opening document-upload modal from ProjectDocumentation');
        openModal('document-upload', {});
      }
    }
  };

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
    // En desktop no abrimos modal, solo actualizamos el estado
    setIsPreviewOpen(false);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedDocument(null);
  };

  const handleExpandPdf = () => {
    setIsPreviewOpen(true);
  };

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
      {/* Desktop: Vertical Layout */}
      <div className="hidden lg:flex flex-col h-full gap-4">
        {/* Top: Document Viewer and Info */}
        <div className="flex-1 flex gap-4">
          {/* Left: Document Viewer (2/3) */}
          <div className="w-2/3 min-w-0">
          <div 
            className="rounded-lg overflow-hidden border h-full"
          >
            {selectedDocument ? (
              selectedDocument.file_type === 'application/pdf' ? (
                <PdfViewer
                  bucket="design-documents"
                  path={selectedDocument.file_url}
                  useSignedUrl={false}
                  className="w-full h-full"
                />
              ) : (
                <UnifiedViewer
                  bucket="design-documents"
                  path={selectedDocument.file_url}
                  mimeType={selectedDocument.file_type}
                  fileName={selectedDocument.file_name}
                  useSignedUrl={false}
                  className="w-full h-full"
                  height={520}
                  onExpand={handleExpandPdf}
                />
              )
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
          {/* Left Card: Document Explorer */}
          <div className="flex-1">
            <Card className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4 text-[var(--accent)]" />
                  <div className="flex-1">
                    <h2 className="text-sm font-medium text-[var(--card-fg)]">Explorador de Documentos</h2>
                    <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
                      Navega por las carpetas y archivos del proyecto
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <DocumentExplorer 
                      onSelectDocument={handleDocumentSelect}
                      selectedDocument={selectedDocument}
                    />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Card: Recent Documents */}
          <div className="flex-1">
            <Card className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--accent)]" />
                  <div className="flex-1">
                    <h2 className="text-sm font-medium text-[var(--card-fg)]">Documentos Recientes</h2>
                    <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
                      Últimos archivos modificados en el proyecto
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {recentDocuments.length > 0 ? (
                      recentDocuments.map((doc: any) => {
                        const IconComponent = getFileIcon(doc.file_mime);
                        return (
                          <div
                            key={doc.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50",
                              selectedDocument?.id === doc.id && "bg-accent/30 border-accent"
                            )}
                            onClick={() => handleDocumentSelect(doc)}
                          >
                            <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {doc.file_name}
                                </p>
                                {doc.status && (
                                  <Badge variant="secondary" className={cn("text-xs", getStatusColor(doc.status))}>
                                    {getStatusText(doc.status)}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatFileSize(doc.file_size)}</span>
                                <span>•</span>
                                <span>
                                  {doc.created_at ? format(new Date(doc.created_at), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No hay documentos recientes
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

      {/* Mobile Layout */}
      <div className="lg:hidden h-full flex flex-col">
        {/* Mobile Document Explorer */}
        <div className="flex-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Documentos del Proyecto</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <DocumentExplorer 
                    onSelectDocument={(doc) => {
                      setSelectedDocument(doc);
                      setIsPreviewOpen(true);
                    }}
                    selectedDocument={selectedDocument}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal for Mobile */}
      {isPreviewOpen && selectedDocument && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          document={selectedDocument}
        />
      )}
    </Layout>
  );
}