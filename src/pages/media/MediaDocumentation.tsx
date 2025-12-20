import { useState, useEffect } from 'react';
import { DocumentExplorer } from '@/components/shared/legacy/DocumentExplorer';
import { DocumentInfo } from '@/components/shared/legacy/DocumentInfo';
import { DocumentPreviewModal } from '@/features/projects';
import { UnifiedViewer } from '@/components/shared/viewers/UnifiedViewer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import { useGlobalModalStore } from '@/components/modal';
import { useDesignDocuments } from '@/hooks/use-design-documents';
import { useDesignDocumentFolders } from '@/hooks/use-design-document-folders';
import { FileText, FolderOpen, Clock, Plus, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function MediaDocumentation() {
  const { openModal } = useGlobalModalStore();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const { data: allDocuments } = useDesignDocuments();
  const { data: allFolders } = useDesignDocumentFolders();
  const recentDocuments = allDocuments?.slice(0, 10) || [];

  useEffect(() => {
    if (recentDocuments.length > 0 && !selectedDocument) {
      setSelectedDocument(recentDocuments[0]);
    }
  }, [recentDocuments, selectedDocument]);

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

  // Empty state: No folders exist yet
  if (!allFolders || allFolders.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen />}
        title="Crea tu primera carpeta"
        description="Organiza tus documentos creando carpetas por tipo, etapa o cualquier categoría que necesites"
        action={
          <Button onClick={() => openModal('document-folder', {})}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Carpeta
          </Button>
        }
      />
    );
  }

  // Empty state: Folders exist but no documents
  if (!allDocuments || allDocuments.length === 0) {
    return (
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
    );
  }

  return (
    <>
      <div className="hidden lg:flex flex-col h-full gap-4">
        <div className="flex-1 flex gap-4">
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

          <div className="w-1/3">
            <DocumentInfo 
              document={selectedDocument}
              onDownload={() => selectedDocument && window.open(selectedDocument.file_url, '_blank')}
              onShare={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        </div>

        <div className="flex gap-4 h-80">
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

      <div className="lg:hidden">
        <DocumentExplorer onDocumentSelect={handleDocumentSelect} />
        
        <DocumentPreviewModal 
          document={selectedDocument}
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
        />
      </div>

      <div className="hidden lg:block">
        <DocumentPreviewModal 
          document={selectedDocument}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      </div>
    </>
  );
}
