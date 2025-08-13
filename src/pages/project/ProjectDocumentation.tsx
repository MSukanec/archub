import React, { useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DocumentExplorer } from '@/components/ui-custom/DocumentExplorer';
import { DocumentPreviewModal } from '@/components/modal/modals/project/DocumentPreviewModal';
import { PdfViewer } from '@/components/viewers/PdfViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useDesignDocuments } from '@/hooks/use-design-documents';
import { FileText, FolderPlus, File, Image, Clock, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProjectDocumentation() {
  const { openModal } = useGlobalModalStore();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Get recent documents for history
  const { data: allDocuments } = useDesignDocuments();
  const recentDocuments = allDocuments?.slice(0, 10) || [];

  const headerProps = {
    icon: FileText,
    title: "Documentación",
    actionButton: {
      label: "Nueva Carpeta",
      icon: FolderPlus,
      onClick: () => {
        openModal('document-folder', {});
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
      {/* Desktop: Three Panel Layout */}
      <div className="hidden lg:flex flex-col h-full gap-4">
        {/* Top Panel: Document Viewer - 2/3 Height */}
        <div className="h-2/3 rounded-lg overflow-hidden">
          {selectedDocument ? (
            <>
              {selectedDocument.file_type === 'application/pdf' ? (
                <PdfViewer 
                  bucket="design-documents"
                  path={selectedDocument.file_path}
                  fileName={selectedDocument.file_name}
                  className="w-full h-full"
                />
              ) : selectedDocument.file_type?.startsWith('image/') ? (
                <div className="w-full h-full flex items-center justify-center bg-muted/20 p-4">
                  <img 
                    src={selectedDocument.file_url} 
                    alt={selectedDocument.file_name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <File className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">Vista previa no disponible</h4>
                    <p className="text-muted-foreground mb-4">
                      Este tipo de archivo no se puede mostrar en el navegador
                    </p>
                  </div>
                </div>
              )}
            </>
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

        {/* Bottom Panel: Two Columns - 1/3 Height */}
        <div className="h-1/3 flex gap-4">
          {/* Left: Document Explorer - 50% Width */}
          <div className="w-1/2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Explorador de Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <DocumentExplorer onDocumentSelect={handleDocumentSelect} className="h-full" />
              </CardContent>
            </Card>
          </div>

          {/* Right: Recent Documents History - 50% Width */}
          <div className="w-1/2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Documentos Recientes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-1">
                    {recentDocuments.length > 0 ? (
                      recentDocuments.map((doc) => (
                        <div 
                          key={doc.id}
                          className={`flex items-center justify-between py-2 px-3 rounded cursor-pointer transition-colors ${
                            selectedDocument?.id === doc.id 
                              ? 'bg-green-500 text-white' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleDocumentSelect(doc)}
                        >
                          <span className="text-sm font-medium truncate flex-1 pr-2">{doc.file_name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {format(new Date(doc.created_at), 'dd MMM', { locale: es })}
                          </span>
                        </div>
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
    </Layout>
  );
}