import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FileText, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, GripVertical, BookOpen, Heading, Table, FileBarChart, Calculator, FileSignature, Settings } from 'lucide-react';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { PdfDocument } from '@/components/pdf/PdfDocument';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
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

  // PDF general configuration
  const [pdfConfig, setPdfConfig] = useState({
    pageSize: 'A4' as 'A4' | 'Letter',
    orientation: 'portrait' as 'portrait' | 'landscape',
    margin: 20, // mm
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

  // Expanded section for accordion (only one at a time)
  const [expandedSection, setExpandedSection] = useState<string>('general');
  
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

  // Toggle expanded section (only one at a time)
  const toggleExpanded = (section: string) => {
    setExpandedSection(prev => prev === section ? '' : section);
  };

  // Section component - prepared for drag & drop
  interface SectionItemProps {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    checked: boolean;
    onToggle: () => void;
    onExpand: () => void;
    isExpanded: boolean;
    description?: string;
  }

  const SectionItem: React.FC<SectionItemProps> = ({ 
    id, 
    label, 
    icon: Icon, 
    checked, 
    onToggle, 
    onExpand, 
    isExpanded,
    description 
  }) => (
    <div 
      className="border border-border rounded-lg overflow-hidden bg-card"
      data-section-id={id} // For future drag & drop
    >
      {/* Section Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onExpand}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle - for future use */}
          <div className="text-muted-foreground cursor-grab">
            <GripVertical className="h-4 w-4" />
          </div>
          
          {/* Icon */}
          <Icon className="h-4 w-4 text-accent" />
          
          {/* Label */}
          <span className="text-sm font-medium">{label}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Switch */}
          <Switch
            checked={checked}
            onCheckedChange={onToggle}
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Expand Chevron */}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-border/50">
          <p className="text-xs text-muted-foreground mt-2">
            {description || `Configurar opciones para ${label.toLowerCase()}`}
          </p>
          {/* Future: Additional configuration options here */}
        </div>
      )}
    </div>
  );

  // Sections configuration panel
  const sectionsPanel = (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b bg-muted/30">
        <h3 className="font-medium text-sm text-muted-foreground">SECCIONES</h3>
      </div>
      
      <div className="flex-1 p-3 space-y-2 overflow-auto">
        {/* General Section - Always active, no switch */}
        <div 
          className="border border-border rounded-lg overflow-hidden bg-card"
          data-section-id="general"
        >
          {/* Section Header */}
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleExpanded('general')}
          >
            <div className="flex items-center gap-3">
              {/* Drag Handle - for future use */}
              <div className="text-muted-foreground cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>
              
              {/* Icon */}
              <Settings className="h-4 w-4 text-accent" />
              
              {/* Label */}
              <span className="text-sm font-medium">General</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* No switch for general section */}
              
              {/* Expand Chevron */}
              {expandedSection === 'general' ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          
          {/* Expanded Content */}
          {expandedSection === 'general' && (
            <div className="px-3 pb-3 pt-0 border-t border-border/50">
              <div className="mt-3 space-y-4">
                {/* Page Size */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Tamaño de Página</Label>
                  <Select 
                    value={pdfConfig.pageSize} 
                    onValueChange={(value: 'A4' | 'Letter') => setPdfConfig(prev => ({ ...prev, pageSize: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                      <SelectItem value="Letter">Carta (216 × 279 mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Orientation */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Orientación</Label>
                  <Select 
                    value={pdfConfig.orientation} 
                    onValueChange={(value: 'portrait' | 'landscape') => setPdfConfig(prev => ({ ...prev, orientation: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Vertical</SelectItem>
                      <SelectItem value="landscape">Apaisada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Margins */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Márgenes (mm)</Label>
                  <Input
                    type="number"
                    value={pdfConfig.margin}
                    onChange={(e) => setPdfConfig(prev => ({ ...prev, margin: parseInt(e.target.value) || 20 }))}
                    min="0"
                    max="50"
                    className="h-8"
                    placeholder="20"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <SectionItem
          id="coverPage"
          label="Portada"
          icon={BookOpen}
          checked={sections.coverPage}
          onToggle={() => toggleSection('coverPage')}
          onExpand={() => toggleExpanded('coverPage')}
          isExpanded={expandedSection === 'coverPage'}
          description="Página inicial del documento con información general del presupuesto"
        />
        
        <SectionItem
          id="header"
          label="Encabezado"
          icon={Heading}
          checked={sections.header}
          onToggle={() => toggleSection('header')}
          onExpand={() => toggleExpanded('header')}
          isExpanded={expandedSection === 'header'}
          description="Información del proyecto y empresa en la parte superior"
        />
        
        <SectionItem
          id="tableHeader"
          label="Cabecera de Tabla"
          icon={Table}
          checked={sections.tableHeader}
          onToggle={() => toggleSection('tableHeader')}
          onExpand={() => toggleExpanded('tableHeader')}
          isExpanded={expandedSection === 'tableHeader'}
          description="Encabezados de columnas para la tabla de tareas"
        />
        
        <SectionItem
          id="tableContent"
          label="Contenido de Tabla"
          icon={FileBarChart}
          checked={sections.tableContent}
          onToggle={() => toggleSection('tableContent')}
          onExpand={() => toggleExpanded('tableContent')}
          isExpanded={expandedSection === 'tableContent'}
          description="Filas con las tareas y sus detalles"
        />
        
        <SectionItem
          id="totals"
          label="Totales"
          icon={Calculator}
          checked={sections.totals}
          onToggle={() => toggleSection('totals')}
          onExpand={() => toggleExpanded('totals')}
          isExpanded={expandedSection === 'totals'}
          description="Resumen de costos y totales del presupuesto"
        />
        
        <SectionItem
          id="footer"
          label="Pie de Página"
          icon={FileSignature}
          checked={sections.footer}
          onToggle={() => toggleSection('footer')}
          onExpand={() => toggleExpanded('footer')}
          isExpanded={expandedSection === 'footer'}
          description="Información adicional al final del documento"
        />
      </div>
    </div>
  );

  // Action bar with controls
  const actionBar = (
    <div className="flex items-center justify-center gap-2 p-3 bg-muted/30 border-b">
      {!state.loading && !state.error && (
        <>
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
        </>
      )}
    </div>
  );

  // PDF canvas only
  const pdfCanvas = (
    <div className="h-full overflow-auto bg-gray-100 dark:bg-gray-900">
      {state.loading && (
        <div className="h-full flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-sm text-muted-foreground">Generando PDF...</p>
        </div>
      )}

      {state.error && (
        <div className="h-full flex flex-col items-center justify-center">
          <FileText className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-sm text-red-500 mb-4">{state.error}</p>
          <Button onClick={loadPdf} variant="outline" size="sm">
            Reintentar
          </Button>
        </div>
      )}

      {!state.loading && !state.error && (
        <div className="p-4 flex justify-center">
          <div className="bg-white shadow-lg rounded border">
            <canvas 
              ref={canvasRef}
              className="block"
            />
          </div>
        </div>
      )}
    </div>
  );

  const editPanel = null;

  // New layout: Action bar + Two columns
  const viewPanel = (
    <div className="h-full flex flex-col">
      {/* Action bar at top */}
      {actionBar}
      
      {/* Two columns below */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column - Sections configuration */}
        <div className="w-1/3 border-r">
          {sectionsPanel}
        </div>
        
        {/* Right column - PDF canvas only */}
        <div className="flex-1">
          {pdfCanvas}
        </div>
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