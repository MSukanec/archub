import React, { useState } from 'react';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, FileText } from 'lucide-react';
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
  if (!document || !isOpen) return null;

  const isPDF = document.file_type === 'application/pdf';
  const isImage = document.file_type?.startsWith('image/');
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const handleDownload = () => {
    const link = globalThis.document.createElement('a');
    link.href = document.file_url;
    link.download = document.file_name;
    link.click();
  };

  const handleOpenExternal = () => {
    window.open(document.file_url, '_blank');
  };

  // Header con información del documento
  const headerContent = (
    <FormModalHeader 
      title={document.file_name}
      icon={FileText}
      description={formatFileSize(document.file_size)}
    />
  );

  // Footer con botones de acción
  const footerContent = (
    <FormModalFooter
      leftLabel="Cerrar"
      onLeftClick={onClose}
      rightLabel="Descargar"
      onRightClick={handleDownload}
    />
  );

  // Panel de vista con el contenido del documento
  const viewPanel = (
    <div className="w-full h-full min-h-[600px]">
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
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Vista previa no disponible</h3>
            <p className="text-muted-foreground mb-4">
              Este tipo de archivo no se puede previsualizar en el navegador.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenExternal}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir en nueva pestaña
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <FormModalLayout
      wide={true}
      columns={1}
      viewPanel={viewPanel}
      editPanel={null}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={false}
    />
  );
}