import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCw, Download, ExternalLink, FileText, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DocumentPreviewProps {
  document: {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size?: number;
    status?: string;
    created_at: string;
  } | null;
  onClose: () => void;
}

export function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!document) {
    return (
      <Card className="w-full h-96 shadow-lg">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Selecciona un documento para ver la vista previa</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
      case 'aprobado': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_revision': return 'bg-blue-100 text-blue-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg">{document.file_name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(document.file_size)}
                </span>
                {document.status && (
                  <Badge variant="outline" className={getStatusColor(document.status)}>
                    {document.status === 'pendiente' && 'Pendiente'}
                    {document.status === 'en_revision' && 'En Revisión'}
                    {document.status === 'aprobado' && 'Aprobado'}
                    {document.status === 'rechazado' && 'Rechazado'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-96 border rounded-lg overflow-hidden bg-gray-50">
          {isPDF ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-center">
              <div className="text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Vista previa de PDF</p>
                <p className="text-sm mb-4">
                  Los PDFs se abren en una nueva pestaña por seguridad del navegador
                </p>
              </div>
              <Button
                onClick={handleOpenExternal}
                className="flex items-center gap-2"
                size="lg"
              >
                <ExternalLink className="h-5 w-5" />
                Abrir PDF en nueva pestaña
              </Button>
            </div>
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
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Vista previa no disponible</p>
                <p className="text-sm mb-4">
                  Este tipo de archivo ({document.file_type}) no se puede previsualizar
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}