import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCw, Download, ExternalLink, FileText } from 'lucide-react';
import { PdfViewer } from '@/components/viewers/PdfViewer';

interface DocumentPreviewModalProps {
  document: {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_path?: string;
    file_size?: number;
    status?: string;
    created_at: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreviewModal({ document, isOpen, onClose }: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!document) return null;

  const isPDF = document.file_type === 'application/pdf';
  const isImage = document.file_type?.startsWith('image/');
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  
  const handleDownload = () => {
    const link = globalThis.document.createElement('a');
    link.href = document.file_url;
    link.download = document.file_name;
    link.click();
  };

  const handleOpenExternal = () => {
    window.open(document.file_url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <DialogTitle className="text-lg truncate">{document.file_name}</DialogTitle>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(document.file_size)}
                  </span>
                  {document.status && (
                    <Badge variant="outline" className={getStatusColor(document.status)}>
                      {getStatusText(document.status)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isImage && (
                <>
                  <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-12 text-center">
                    {zoom}%
                  </span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRotate}>
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <div className="w-full h-full border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            {isPDF ? (
              <PdfViewer
                bucket="design-documents"
                path={document.file_path || document.file_url}
                fileName={document.file_name}
                useSignedUrl={false}
                className="w-full h-full"
              />
            ) : isImage ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={document.file_url}
                  alt={document.file_name}
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-medium mb-2">Vista previa no disponible</p>
                  <p className="text-sm mb-6 max-w-md">
                    Este tipo de archivo ({document.file_type}) no se puede previsualizar directamente
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" size="lg" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar archivo
                    </Button>
                    <Button variant="outline" size="lg" onClick={handleOpenExternal}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir archivo
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}