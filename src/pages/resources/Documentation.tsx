import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DocumentExplorer } from '@/components/ui-custom/DocumentExplorer';
import { DocumentInfo } from '@/components/ui-custom/DocumentInfo';
import { DocumentPreviewModal } from '@/components/modal/modals/project/DocumentPreviewModal';
import { UnifiedViewer } from '@/components/viewers/UnifiedViewer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { cn } from '@/lib/utils';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useDesignDocuments } from '@/hooks/use-design-documents';
import { FileText, FolderOpen, Clock, Upload, Plus, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Documentation() {
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
        console.log('Opening document-upload modal from Documentation');
        openModal('document-upload', {});
      }
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

  return (
    <Layout headerProps={headerProps} wide={true}>
      {/* Check if there are any documents in the system */}
      {!allDocuments || allDocuments.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No hay documentos disponibles"
          description="Sube tus primeros documentos para comenzar a organizar tu biblioteca de proyectos"
          action={
            <Button onClick={() => openModal('document-upload', {})}>
              <Plus className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          }
        />
      ) : (
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
                  <CardHeader 
                    icon={FolderOpen}
                    title="Explorador de Documentos"
                    description="Navega por las carpetas y archivos de documentación"
                  />
                  <CardContent className="flex-1 p-0 min-h-0">
                    <DocumentExplorer onDocumentSelect={handleDocumentSelect} />
                  </CardContent>
                </Card>
              </div>

              {/* Right: Recent Files History (1/3) */}
              <div className="w-1/3">
                <Card className="h-full flex flex-col">
                  <CardHeader 
                    icon={Clock}
                    title="Historial"
                    description="Accede rápidamente a los últimos documentos visualizados"
                  />
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-1">
                        {recentDocuments.length > 0 ? (
                          recentDocuments.map((doc) => (
                            <Button
                              key={doc.id}
                              variant={selectedDocument?.id === doc.id ? "secondary" : "ghost"}
                              size="icon-sm"
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
    </Layout>
  );
}