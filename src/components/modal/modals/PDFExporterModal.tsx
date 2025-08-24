import React, { useState } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { FileText, Download } from 'lucide-react';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { Button } from '@/components/ui/button';
import { PdfDocument } from '@/components/pdf/PdfDocument';
import { PdfBlock } from '@/components/pdf/types';

interface PDFExporterModalProps {
  modalData?: {
    blocks?: PdfBlock[];
    filename?: string;
  };
  onClose: () => void;
}

export function PDFExporterModal({ modalData, onClose }: PDFExporterModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const blocks = modalData?.blocks || [];
  const filename = modalData?.filename || `documento-${new Date().toISOString().split('T')[0]}.pdf`;

  const viewPanel = (
    <div className="space-y-6 py-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
          <FileText className="h-8 w-8 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">PDF Listo para Descargar</h3>
          <p className="text-sm text-muted-foreground">
            Tu presupuesto de tareas de construcción está listo. Haz clic en el botón para descargarlo.
          </p>
        </div>
      </div>
      
      <div className="flex justify-center">
        <PDFDownloadLink
          document={<PdfDocument blocks={blocks} />}
          fileName={filename}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg hover:bg-[var(--accent)]/90 transition-colors font-medium"
        >
          {({ blob, url, loading, error }) => (
            <>
              <Download className="h-4 w-4" />
              {loading ? 'Generando PDF...' : 'Descargar PDF'}
            </>
          )}
        </PDFDownloadLink>
      </div>
    </div>
  );

  const editPanel = null; // Este modal no tiene modo edición

  const headerContent = (
    <FormModalHeader 
      title="Exportar PDF"
      description="Genera y descarga un PDF con el presupuesto de tareas de construcción"
      icon={FileText}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cerrar"
      onLeftClick={onClose}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={false} // Siempre mostrar en modo vista
    />
  );
}