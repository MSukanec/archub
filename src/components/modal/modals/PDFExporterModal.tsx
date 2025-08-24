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
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden" style={{ height: '60vh' }}>
        <PDFViewer width="100%" height="100%">
          <PdfDocument blocks={blocks} />
        </PDFViewer>
      </div>
      
      <div className="flex justify-center">
        <PDFDownloadLink
          document={<PdfDocument blocks={blocks} />}
          fileName={filename}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
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
    <div className="p-4 border-t border-[var(--card-border)] mt-auto">
      <div className="flex justify-end">
        <Button
          variant="secondary"
          onClick={onClose}
          className="px-4"
        >
          Cerrar
        </Button>
      </div>
    </div>
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