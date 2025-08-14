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
      {/* Desktop: Three Column Layout - Full Height */}
      <div className="hidden lg:flex gap-4" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Left Column: Document Explorer (20%) */}
        <div className="w-[20%] flex flex-col">
          <Card className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-[var(--accent)]" />
                <div className="flex-1">
                  <h2 className="text-sm font-medium text-[var(--card-fg)]">Explorador</h2>
                  <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
                    Carpetas y archivos
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="flex-1 p-0">
              <DocumentExplorer onDocumentSelect={handleDocumentSelect} className="h-full" />
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Document Viewer (60%) */}
        <div className="w-[60%] min-w-0">
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
                className="w-full h-full"
                onExpand={handleExpandPdf}
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

        {/* Right Column: Document Info + Recent Documents (20%) */}
        <div className="w-[20%] flex flex-col gap-4">
          {/* Document Info - Top Half */}
          <div className="flex-1">
            <DocumentInfo 
              document={selectedDocument}
              onDownload={() => selectedDocument && window.open(selectedDocument.file_url, '_blank')}
              onShare={() => {/* TODO: Implement share */}}
              onEdit={() => {/* TODO: Implement edit */}}
              onDelete={() => {/* TODO: Implement delete */}}
            />
          </div>

          {/* Recent Documents - Bottom Half */}
          <div className="flex-1">
            <Card className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--accent)]" />
                  <div className="flex-1">
                    <h2 className="text-sm font-medium text-[var(--card-fg)]">Recientes</h2>
                    <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
                      Últimos documentos
                    </p>
                  </div>
                </div>
              </div>
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
    </Layout>
  );
}