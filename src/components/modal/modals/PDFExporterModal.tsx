import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FileText, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { PdfDocument } from '@/components/pdf/PdfDocument';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PdfBlock } from '@/components/pdf/types';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFExporterModalProps {
  modalData?: {
    blocks?: PdfBlock[];
    filename?: string;
  };
  onClose: () => void;
}

export function PDFExporterModal({ modalData, onClose }: PDFExporterModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState({
    loading: true,
    error: null as string | null,
    pdfDoc: null as any,
    blob: null as Blob | null,
    page: 1,
    numPages: 0,
    scale: 1.0,
  });

  // PDF sections configuration
  const [sections, setSections] = useState({
    coverPage: true,
    header: true,
    tableHeader: true,
    tableContent: true,
    totals: true,
    footer: true,
  });
  
  const blocks = modalData?.blocks || [];
  const filename = modalData?.filename || `documento-${new Date().toISOString().split('T')[0]}.pdf`;

  // Generate PDF blob from blocks using react-pdf
  const generatePdfBlob = useCallback(async (): Promise<Blob> => {
    const pdfDoc = <PdfDocument blocks={blocks} />;
    const asPdf = pdf(pdfDoc);
    return await asPdf.toBlob();
  }, [blocks]);

  // Load PDF using pdfjs-dist
  const loadPdf = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const blob = await generatePdfBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setState(prev => ({
        ...prev,
        loading: false,
        pdfDoc,
        blob,
        numPages: pdfDoc.numPages,
        page: 1,
      }));
    } catch (error) {
      console.error('Error loading PDF:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al generar el PDF'
      }));
    }
  }, [generatePdfBlob]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!state.pdfDoc || !canvasRef.current) return;

    try {
      const page = await state.pdfDoc.getPage(state.page);
      const scale = state.scale;
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      };
      await page.render(renderContext).promise;

    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }, [state.pdfDoc, state.page, state.scale]);

  // Navigation functions
  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= state.numPages) {
      setState(prev => ({ ...prev, page: pageNum }));
    }
  };

  const nextPage = () => goToPage(state.page + 1);
  const prevPage = () => goToPage(state.page - 1);

  // Zoom functions
  const zoomIn = () => {
    setState(prev => ({ 
      ...prev, 
      scale: Math.min(prev.scale + 0.1, 3.0) 
    }));
  };

  const zoomOut = () => {
    setState(prev => ({ 
      ...prev, 
      scale: Math.max(prev.scale - 0.1, 0.5) 
    }));
  };

  const zoom100 = () => {
    setState(prev => ({ ...prev, scale: 1.0 }));
  };

  // Load PDF on mount
  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // Render page when page or scale changes
  useEffect(() => {
    if (state.pdfDoc && !state.loading) {
      renderPage();
    }
  }, [renderPage, state.pdfDoc, state.loading]);

  // Toggle section
  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Sections configuration panel
  const sectionsPanel = (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-medium text-sm">SECCIONES</h3>
      </div>
      
      <div className="flex-1 p-4 space-y-3">
        {[
          { key: 'coverPage', label: 'Portada', icon: '📋' },
          { key: 'header', label: 'Encabezado', icon: '📄' },
          { key: 'tableHeader', label: 'Cabecera de Tabla', icon: '📊' },
          { key: 'tableContent', label: 'Contenido de Tabla', icon: '📝' },
          { key: 'totals', label: 'Totales', icon: '💰' },
          { key: 'footer', label: 'Pie de Página', icon: '📃' },
        ].map(({ key, label, icon }) => (
          <div key={key} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="text-sm">{icon}</span>
              <span className="text-sm">{label}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sections[key as keyof typeof sections]}
                onChange={() => toggleSection(key as keyof typeof sections)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  // PDF preview panel
  const previewPanel = (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {state.loading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-sm text-muted-foreground">Generando PDF...</p>
        </div>
      )}

      {state.error && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <FileText className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-sm text-red-500 mb-4">{state.error}</p>
          <Button onClick={loadPdf} variant="outline" size="sm">
            Reintentar
          </Button>
        </div>
      )}

      {!state.loading && !state.error && (
        <>
          {/* PDF Toolbar */}
          <div className="p-2 bg-background border-b">
            <div className="flex items-center justify-center gap-2">
              {/* Page navigation */}
              <Button
                variant="ghost"
                size="sm"
                onClick={prevPage}
                disabled={state.page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1 px-2">
                <span className="text-sm">{state.page}</span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-sm">{state.numPages}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={nextPage}
                disabled={state.page >= state.numPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <div className="w-px h-4 bg-border mx-1" />

              {/* Zoom controls */}
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                disabled={state.scale <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              <Badge 
                variant="outline" 
                className="px-2 cursor-pointer hover:bg-accent text-xs min-w-12 justify-center"
                onClick={zoom100}
                title="Zoom 100%"
              >
                {Math.round(state.scale * 100)}%
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                disabled={state.scale >= 3.0}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* PDF Canvas */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 flex justify-center">
              <div className="bg-white shadow-lg rounded border">
                <canvas 
                  ref={canvasRef}
                  className="block"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const editPanel = null;

  // Two column layout
  const viewPanel = (
    <div className="flex h-full">
      {/* Left column - Sections configuration */}
      <div className="w-1/3 border-r bg-background">
        {sectionsPanel}
      </div>
      
      {/* Right column - PDF preview */}
      <div className="flex-1">
        {previewPanel}
      </div>
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title="Exportar PDF"
      description="Genera y descarga un PDF con el presupuesto de tareas de construcción"
      icon={FileText}
    />
  );

  const footerContent = (
    <div className="p-2 border-t border-[var(--card-border)] mt-auto relative z-0">
      <div className="flex gap-2 w-full">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="w-1/4"
        >
          Cerrar
        </Button>
        <div className="flex-1">
          <PDFDownloadLink
            document={<PdfDocument blocks={blocks} />}
            fileName={filename}
            className="w-full"
          >
            {({ blob, url, loading, error }) => (
              <Button
                type="button"
                variant="default"
                disabled={loading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? 'Generando PDF...' : 'Descargar PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
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
      isEditing={false}
      fullscreen={true}
      className="[&>*]:p-0" // Remove default padding to use full space
    />
  );
}