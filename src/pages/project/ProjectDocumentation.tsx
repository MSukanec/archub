import React, { useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DocumentExplorer } from '@/components/ui-custom/DocumentExplorer';
import { DocumentPreviewModal } from '@/components/modal/modals/project/DocumentPreviewModal';
import { PdfViewer } from '@/components/viewers/PdfViewer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { FileText, FolderPlus, File, Image } from 'lucide-react';

export default function ProjectDocumentation() {
  const { openModal } = useGlobalModalStore();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
      {/* Desktop: Two Column Layout */}
      <div className="hidden lg:flex h-full gap-6">
        {/* Left Column: Document Viewer */}
        <div className="w-1/2 flex flex-col">
          <Card className="flex-1 flex flex-col">
            {selectedDocument ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {React.createElement(getFileIcon(selectedDocument.file_type), { 
                          className: "h-5 w-5 text-primary" 
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{selectedDocument.file_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {formatFileSize(selectedDocument.file_size)}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(selectedDocument.status)}`}
                          >
                            {getStatusText(selectedDocument.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  {selectedDocument.file_type === 'application/pdf' ? (
                    <PdfViewer 
                      bucket="design-documents"
                      path={selectedDocument.file_path}
                      fileName={selectedDocument.file_name}
                      className="w-full h-full"
                    />
                  ) : selectedDocument.file_type?.startsWith('image/') ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted/20">
                      <img 
                        src={selectedDocument.file_url} 
                        alt={selectedDocument.file_name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Vista previa no disponible</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Haz clic en descargar para ver el archivo
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Selecciona un documento</h3>
                  <p className="text-muted-foreground">
                    Haz clic en cualquier archivo para verlo aquí
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column: Document Explorer */}
        <div className="w-1/2">
          <DocumentExplorer onDocumentSelect={handleDocumentSelect} />
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