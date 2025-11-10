import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FileText, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, GripVertical, BookOpen, Heading, Table, FileBarChart, Calculator, FileSignature, Settings, Calendar } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { PdfBlock } from '@/components/pdf/types';
import { useCurrentUser } from '@/hooks/use-current-user';
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
  const { data: userData } = useCurrentUser();
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
    pageSize: 'A4' as 'A4' | 'LETTER',
    orientation: 'portrait' as 'portrait' | 'landscape',
    margin: 20, // mm
  });

  // PDF sections configuration
  const [sections, setSections] = useState({
    coverPage: true,
    header: true,
    constructionTasks: true,
    paymentPlan: true,
    footer: true,
  });

  // Get blocks from modal data
  const blocks = modalData?.blocks || [];
  const baseFilename = modalData?.filename || `documento-${new Date().toISOString().split('T')[0]}.pdf`;

  // Footer configuration - Initialize with text from blocks if available
  const [footerConfig, setFooterConfig] = useState(() => {
    const footerBlock = blocks.find(block => block.type === 'footer');
    return {
      text: footerBlock?.data?.text || 'Generado automáticamente',
      showDivider: true,
    };
  });

  // Construction tasks table configuration
  const [tableConfig, setTableConfig] = useState({
    titleSize: 12, // int4 for header text size
    bodySize: 10,  // int4 for body text size
    showTableBorder: true, // bool for complete table border
    showRowDividers: true, // bool for lines between items
    groupBy: 'fases-y-rubros' as 'fase' | 'rubro' | 'fases-y-rubros', // grouping option
  });

  // Header configuration with pre-populated data
  const [headerConfig, setHeaderConfig] = useState({
    title: 'Plan de Pagos',
    subtitle: '',
    organizationName: userData?.organization?.name || '',
    projectName: '',
    projectAddress: '',
    budgetDate: new Date().toLocaleDateString('es-AR'),
    budgetNumber: '',
    contactPerson: userData?.user?.full_name || '',
    phone: '',
    email: userData?.user?.email || '',
    showLogo: true,
    logoUrl: userData?.organization?.logo_url || '',
    logoSize: 60,
    showDivider: true,
    layout: 'row' as 'row' | 'column',
  });

  // Payment plan configuration
  const [paymentPlanConfig, setPaymentPlanConfig] = useState({
    showSchedule: true, // Cronograma de cuotas
    showDetailTable: true, // Tabla detallada por unidad
    showPlanInfo: true, // Información del plan
    maxInstallmentFilter: null as number | null, // Filtro de cuotas: null = todas
    oneUnitPerPage: true, // Una unidad por página
  });

  // Generate dynamic filename based on payment plan config
  const filename = useMemo(() => {
    if (paymentPlanConfig.maxInstallmentFilter) {
      // Replace .pdf with filter info and .pdf
      const nameWithoutExtension = baseFilename.replace(/\.pdf$/, '');
      return `${nameWithoutExtension}-hasta-cuota-${paymentPlanConfig.maxInstallmentFilter}.pdf`;
    }
    return baseFilename;
  }, [baseFilename, paymentPlanConfig.maxInstallmentFilter]);

  // Expanded section for accordion (only one at a time)
  const [expandedSection, setExpandedSection] = useState<string>('general');

  // Custom hook for debouncing text inputs
  const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    
    return debouncedValue;
  };

  // Debounce text inputs and number inputs
  const debouncedFooterText = useDebounce(footerConfig.text, 500);
  const debouncedMargin = useDebounce(pdfConfig.margin, 400);
  const debouncedTitleSize = useDebounce(tableConfig.titleSize, 400);
  const debouncedBodySize = useDebounce(tableConfig.bodySize, 400);
  
  // Debounce header text fields
  const debouncedHeaderTitle = useDebounce(headerConfig.title, 500);
  const debouncedHeaderSubtitle = useDebounce(headerConfig.subtitle, 500);
  const debouncedHeaderOrgName = useDebounce(headerConfig.organizationName, 500);
  const debouncedHeaderProjectName = useDebounce(headerConfig.projectName, 500);
  const debouncedHeaderProjectAddress = useDebounce(headerConfig.projectAddress, 500);
  const debouncedHeaderBudgetNumber = useDebounce(headerConfig.budgetNumber, 500);
  const debouncedHeaderContactPerson = useDebounce(headerConfig.contactPerson, 500);
  const debouncedHeaderPhone = useDebounce(headerConfig.phone, 500);
  const debouncedHeaderEmail = useDebounce(headerConfig.email, 500);
  const debouncedHeaderLogoSize = useDebounce(headerConfig.logoSize, 400);
  
  // Create debounced configs
  const debouncedFooterConfig = useMemo(() => ({
    ...footerConfig,
    text: debouncedFooterText
  }), [footerConfig.showDivider, debouncedFooterText]);
  
  const debouncedPdfConfig = useMemo(() => ({
    ...pdfConfig,
    margin: debouncedMargin
  }), [pdfConfig.pageSize, pdfConfig.orientation, debouncedMargin]);
  
  const debouncedTableConfig = useMemo(() => ({
    ...tableConfig,
    titleSize: debouncedTitleSize,
    bodySize: debouncedBodySize
  }), [tableConfig.showTableBorder, tableConfig.showRowDividers, tableConfig.groupBy, debouncedTitleSize, debouncedBodySize]);

  const debouncedHeaderConfig = useMemo(() => ({
    ...headerConfig,
    title: debouncedHeaderTitle,
    subtitle: debouncedHeaderSubtitle,
    organizationName: debouncedHeaderOrgName,
    projectName: debouncedHeaderProjectName,
    projectAddress: debouncedHeaderProjectAddress,
    budgetNumber: debouncedHeaderBudgetNumber,
    contactPerson: debouncedHeaderContactPerson,
    phone: debouncedHeaderPhone,
    email: debouncedHeaderEmail,
    logoSize: debouncedHeaderLogoSize,
  }), [
    headerConfig.showLogo,
    headerConfig.logoUrl,
    headerConfig.showDivider,
    headerConfig.layout,
    headerConfig.budgetDate,
    debouncedHeaderTitle,
    debouncedHeaderSubtitle,
    debouncedHeaderOrgName,
    debouncedHeaderProjectName,
    debouncedHeaderProjectAddress,
    debouncedHeaderBudgetNumber,
    debouncedHeaderContactPerson,
    debouncedHeaderPhone,
    debouncedHeaderEmail,
    debouncedHeaderLogoSize,
  ]);

  // Generate PDF blob from blocks using react-pdf with debounced configurations
  const generatePdfBlob = useCallback(async (): Promise<Blob> => {
    try {
      // Filter blocks based on current sections configuration
      const filteredBlocks = blocks.filter(block => {
        if (block.type === 'coverPage') return sections.coverPage;
        if (block.type === 'header') return sections.header;
        if (block.type === 'budgetTable') return sections.constructionTasks;
        if (block.type === 'tableHeader') return sections.constructionTasks;
        if (block.type === 'tableContent') return sections.constructionTasks;
        if (block.type === 'totals') return sections.constructionTasks;
        if (block.type === 'paymentPlan') return sections.paymentPlan;
        if (block.type === 'footer') return sections.footer;
        return true;
      }).map(block => {
        // Override footer data with debounced footerConfig
        if (block.type === 'footer') {
          return {
            ...block,
            data: {
              text: debouncedFooterConfig.text,
              showDivider: debouncedFooterConfig.showDivider
            }
          };
        }
        
        // Override payment plan data with paymentPlanConfig and filter installments
        if (block.type === 'paymentPlan') {
          // Filter installments based on maxInstallmentFilter
          let filteredInstallments = block.data?.installments || [];
          if (paymentPlanConfig.maxInstallmentFilter) {
            filteredInstallments = filteredInstallments.filter((inst: any) => 
              inst.number <= paymentPlanConfig.maxInstallmentFilter!
            );
          }
          
          return {
            ...block,
            data: {
              ...block.data,
              installments: filteredInstallments
            },
            config: paymentPlanConfig
          }
        }
        
        return block;
      });
      
      
      const pdfDoc = <PdfDocument blocks={filteredBlocks} config={debouncedPdfConfig} footerConfig={debouncedFooterConfig} tableConfig={debouncedTableConfig} headerConfig={debouncedHeaderConfig} />;
      const asPdf = pdf(pdfDoc);
      return await asPdf.toBlob();
    } catch (error) {
      throw error;
    }
  }, [blocks, sections, debouncedPdfConfig, debouncedFooterConfig, debouncedTableConfig, debouncedHeaderConfig, paymentPlanConfig]);

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

  // Reload PDF when debounced configurations change
  useEffect(() => {
    loadPdf();
  }, [debouncedPdfConfig, debouncedFooterConfig, debouncedTableConfig, sections, loadPdf]);

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
                    onValueChange={(value: 'A4' | 'LETTER') => setPdfConfig(prev => ({ ...prev, pageSize: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                      <SelectItem value="LETTER">Carta (216 × 279 mm)</SelectItem>
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
        
        {/* Header Section - Custom with header controls */}
        <div 
          className="border border-border rounded-lg overflow-hidden bg-card"
          data-section-id="header"
        >
          {/* Section Header */}
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleExpanded('header')}
          >
            <div className="flex items-center gap-3">
              {/* Drag Handle - for future use */}
              <div className="text-muted-foreground cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>
              
              {/* Icon */}
              <Heading className="h-4 w-4 text-accent" />
              
              {/* Label */}
              <span className="text-sm font-medium">Encabezado</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Switch */}
              <Switch
                checked={sections.header}
                onCheckedChange={() => toggleSection('header')}
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Expand Chevron */}
              {expandedSection === 'header' ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          
          {/* Expanded Content with Header Controls */}
          {expandedSection === 'header' && (
            <div className="px-3 pb-3 pt-0 border-t border-border/50">
              <p className="text-xs text-muted-foreground mt-2 mb-4">
                Configura la información del encabezado, logo y datos del proyecto
              </p>
              
              {/* Layout and Logo Settings */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label className="text-xs">Disposición</Label>
                  <Select 
                    value={headerConfig.layout} 
                    onValueChange={(value: 'row' | 'column') => setHeaderConfig(prev => ({ ...prev, layout: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="row">Horizontal</SelectItem>
                      <SelectItem value="column">Vertical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Tamaño Logo</Label>
                  <Input
                    type="number"
                    value={headerConfig.logoSize}
                    onChange={(e) => setHeaderConfig(prev => ({ ...prev, logoSize: parseInt(e.target.value) || 60 }))}
                    min={20}
                    max={120}
                    className="h-8"
                  />
                </div>
              </div>
              
              {/* Logo and Divider Toggles */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={headerConfig.showLogo}
                    onCheckedChange={(checked) => setHeaderConfig(prev => ({ ...prev, showLogo: checked }))}
                    className="scale-75"
                  />
                  <Label className="text-xs">Mostrar Logo</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={headerConfig.showDivider}
                    onCheckedChange={(checked) => setHeaderConfig(prev => ({ ...prev, showDivider: checked }))}
                    className="scale-75"
                  />
                  <Label className="text-xs">Línea Separadora</Label>
                </div>
              </div>
              
              {/* Title and Subtitle */}
              <div className="space-y-3 mb-4">
                <div>
                  <Label className="text-xs font-medium">Título Principal</Label>
                  <Input
                    value={headerConfig.title}
                    onChange={(e) => setHeaderConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="h-8 mt-1"
                    placeholder="Título del documento..."
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Subtítulo</Label>
                  <Input
                    value={headerConfig.subtitle}
                    onChange={(e) => setHeaderConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="h-8 mt-1"
                    placeholder="Subtítulo opcional..."
                  />
                </div>
              </div>
              
              {/* Organization and Project Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label className="text-xs font-medium">Empresa</Label>
                  <Input
                    value={headerConfig.organizationName}
                    onChange={(e) => setHeaderConfig(prev => ({ ...prev, organizationName: e.target.value }))}
                    className="h-8 mt-1"
                    placeholder="Nombre de la empresa..."
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Proyecto</Label>
                  <Input
                    value={headerConfig.projectName}
                    onChange={(e) => setHeaderConfig(prev => ({ ...prev, projectName: e.target.value }))}
                    className="h-8 mt-1"
                    placeholder="Nombre del proyecto..."
                  />
                </div>
              </div>
              
              {/* Address and Budget Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label className="text-xs font-medium">Dirección</Label>
                  <Input
                    value={headerConfig.projectAddress}
                    onChange={(e) => setHeaderConfig(prev => ({ ...prev, projectAddress: e.target.value }))}
                    className="h-8 mt-1"
                    placeholder="Dirección del proyecto..."
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Nº Presupuesto</Label>
                  <Input
                    value={headerConfig.budgetNumber}
                    onChange={(e) => setHeaderConfig(prev => ({ ...prev, budgetNumber: e.target.value }))}
                    className="h-8 mt-1"
                    placeholder="Número de presupuesto..."
                  />
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">Persona de Contacto</Label>
                  <Input
                    value={headerConfig.contactPerson}
                    onChange={(e) => setHeaderConfig(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className="h-8 mt-1"
                    placeholder="Nombre del contacto..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Teléfono</Label>
                    <Input
                      value={headerConfig.phone}
                      onChange={(e) => setHeaderConfig(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-8 mt-1"
                      placeholder="Teléfono..."
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium">Email</Label>
                    <Input
                      value={headerConfig.email}
                      onChange={(e) => setHeaderConfig(prev => ({ ...prev, email: e.target.value }))}
                      className="h-8 mt-1"
                      placeholder="Email..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Construction Tasks Section - Custom with table controls */}
        <div 
          className="border border-border rounded-lg overflow-hidden bg-card"
          data-section-id="constructionTasks"
        >
          {/* Section Header */}
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleExpanded('constructionTasks')}
          >
            <div className="flex items-center gap-3">
              {/* Drag Handle - for future use */}
              <div className="text-muted-foreground cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>
              
              {/* Icon */}
              <Table className="h-4 w-4 text-accent" />
              
              {/* Label */}
              <span className="text-sm font-medium">Tareas de Construcción</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Switch */}
              <Switch
                checked={sections.constructionTasks}
                onCheckedChange={() => toggleSection('constructionTasks')}
                className="data-[state=checked]:bg-accent"
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Expand Chevron */}
              {expandedSection === 'constructionTasks' ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          
          {/* Expanded Content with Table Controls */}
          {expandedSection === 'constructionTasks' && (
            <div className="px-3 pb-3 pt-0 border-t border-border/50">
              <p className="text-xs text-muted-foreground mt-2 mb-4">
                Tabla completa con todas las tareas, costos y totales del presupuesto
              </p>
              
              {/* Text Sizes - Inline */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label htmlFor="titleSize" className="text-xs">Tamaño Título</Label>
                  <Input
                    id="titleSize"
                    type="number"
                    min="8"
                    max="20"
                    value={tableConfig.titleSize}
                    onChange={(e) => setTableConfig(prev => ({ ...prev, titleSize: parseInt(e.target.value) || 12 }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="bodySize" className="text-xs">Tamaño Cuerpo</Label>
                  <Input
                    id="bodySize"
                    type="number"
                    min="6"
                    max="16"
                    value={tableConfig.bodySize}
                    onChange={(e) => setTableConfig(prev => ({ ...prev, bodySize: parseInt(e.target.value) || 10 }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              
              {/* Table Borders - Inline */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label htmlFor="tableBorder" className="text-xs">Borde Tabla</Label>
                  <Select 
                    value={tableConfig.showTableBorder ? "si" : "no"} 
                    onValueChange={(value) => setTableConfig(prev => ({ ...prev, showTableBorder: value === "si" }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Con borde</SelectItem>
                      <SelectItem value="no">Sin borde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rowDividers" className="text-xs">Líneas Divisorias</Label>
                  <Select 
                    value={tableConfig.showRowDividers ? "si" : "no"} 
                    onValueChange={(value) => setTableConfig(prev => ({ ...prev, showRowDividers: value === "si" }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Con líneas</SelectItem>
                      <SelectItem value="no">Sin líneas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Grouping Option */}
              <div>
                <Label htmlFor="groupBy" className="text-xs">Agrupar por</Label>
                <Select 
                  value={tableConfig.groupBy} 
                  onValueChange={(value: 'fase' | 'rubro' | 'fases-y-rubros') => setTableConfig(prev => ({ ...prev, groupBy: value }))}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fase">Fase (oculta primera columna)</SelectItem>
                    <SelectItem value="rubro">Rubro (oculta rubro)</SelectItem>
                    <SelectItem value="fases-y-rubros">Fases y Rubros (oculta ambas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        
        {/* Plan de Pago Section */}
        <div 
          className="border border-border rounded-lg overflow-hidden bg-card"
          data-section-id="paymentPlan"
        >
          {/* Section Header */}
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleExpanded('paymentPlan')}
          >
            <div className="flex items-center gap-3">
              {/* Drag Handle - for future use */}
              <div className="text-muted-foreground cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>
              
              {/* Icon */}
              <Calendar className="h-4 w-4 text-accent" />
              
              {/* Label */}
              <span className="text-sm font-medium">Plan de Pagos</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Switch */}
              <Switch
                checked={sections.paymentPlan}
                onCheckedChange={() => toggleSection('paymentPlan')}
                className="data-[state=checked]:bg-accent"
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Expand Chevron */}
              {expandedSection === 'paymentPlan' ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          
          {/* Expanded Content */}
          {expandedSection === 'paymentPlan' && (
            <div className="px-3 pb-3 pt-0 border-t border-border/50">
              <p className="text-xs text-muted-foreground mt-2 mb-4">
                Tabla detallada del plan de pagos con cronograma de cuotas e información del plan
              </p>
              
              {/* Payment Plan Configuration Controls */}
              <div className="space-y-4 mt-3">
                {/* Plan Information */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Información del Plan</Label>
                  <Switch
                    checked={paymentPlanConfig.showPlanInfo}
                    onCheckedChange={(checked) => setPaymentPlanConfig(prev => ({ ...prev, showPlanInfo: checked }))}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>

                {/* Schedule Table */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Cronograma de Cuotas</Label>
                  <Switch
                    checked={paymentPlanConfig.showSchedule}
                    onCheckedChange={(checked) => setPaymentPlanConfig(prev => ({ ...prev, showSchedule: checked }))}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>

                {/* Detailed Table */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Tabla Detallada por Unidad</Label>
                  <Switch
                    checked={paymentPlanConfig.showDetailTable}
                    onCheckedChange={(checked) => setPaymentPlanConfig(prev => ({ ...prev, showDetailTable: checked }))}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>

                {/* Filtro de Cuotas */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Filtro de Cuotas</Label>
                  <Select
                    value={paymentPlanConfig.maxInstallmentFilter?.toString() || "all"}
                    onValueChange={(value) => 
                      setPaymentPlanConfig(prev => ({
                        ...prev, 
                        maxInstallmentFilter: value === "all" ? null : parseInt(value)
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Seleccionar cuotas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las Cuotas</SelectItem>
                      {(() => {
                        // Get installments from blocks data
                        const paymentBlock = blocks.find(block => block.type === 'paymentPlan');
                        const installments = paymentBlock?.data?.installments || [];
                        return installments.map((installment: any) => (
                          <SelectItem key={installment.id} value={installment.number.toString()}>
                            Hasta Cuota {installment.number.toString().padStart(2, '0')}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                {/* Distribución de Unidades */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Distribución de Unidades</Label>
                  <Select
                    value={paymentPlanConfig.oneUnitPerPage ? "separate" : "continuous"}
                    onValueChange={(value) => 
                      setPaymentPlanConfig(prev => ({
                        ...prev, 
                        oneUnitPerPage: value === "separate"
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="separate">Una unidad por página</SelectItem>
                      <SelectItem value="continuous">Unidades continuas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                  La tabla detallada incluye: Actualización, Valor de Cuota, Pagos y Saldos por unidad funcional
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Section - Custom with text controls */}
        <div 
          className="border border-border rounded-lg overflow-hidden bg-card"
          data-section-id="footer"
        >
          {/* Section Header */}
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleExpanded('footer')}
          >
            <div className="flex items-center gap-3">
              {/* Drag Handle - for future use */}
              <div className="text-muted-foreground cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>
              
              {/* Icon */}
              <FileSignature className="h-4 w-4 text-accent" />
              
              {/* Label */}
              <span className="text-sm font-medium">Pie de Página</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Switch */}
              <Switch
                checked={sections.footer}
                onCheckedChange={() => toggleSection('footer')}
                className="data-[state=checked]:bg-accent"
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Expand Chevron */}
              {expandedSection === 'footer' ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          
          {/* Expanded Content */}
          {expandedSection === 'footer' && (
            <div className="px-3 pb-3 pt-0 border-t border-border/50">
              <div className="mt-3 space-y-4">
                {/* Footer Text */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Texto del Pie de Página</Label>
                  <Textarea
                    value={footerConfig.text}
                    onChange={(e) => setFooterConfig(prev => ({ ...prev, text: e.target.value }))}
                    className="h-20 resize-none"
                    placeholder="Texto que aparecerá en el pie de página..."
                  />
                </div>

                {/* Divider Line */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Línea Divisoria</Label>
                  <Switch
                    checked={footerConfig.showDivider}
                    onCheckedChange={(checked) => setFooterConfig(prev => ({ ...prev, showDivider: checked }))}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
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
            document={<PdfDocument blocks={blocks.filter(block => {
              if (block.type === 'coverPage') return sections.coverPage;
              if (block.type === 'header') return sections.header;
              if (block.type === 'budgetTable') return sections.constructionTasks;
              if (block.type === 'tableHeader') return sections.constructionTasks;
              if (block.type === 'tableContent') return sections.constructionTasks;
              if (block.type === 'totals') return sections.constructionTasks;
              if (block.type === 'paymentPlan') return sections.paymentPlan;
              if (block.type === 'footer') return sections.footer;
              return true;
            }).map(block => {
              // Override footer data
              if (block.type === 'footer') {
                return {
                  ...block,
                  data: {
                    text: debouncedFooterConfig.text,
                    showDivider: debouncedFooterConfig.showDivider
                  }
                };
              }
              
              // Override payment plan data with paymentPlanConfig and filter installments
              if (block.type === 'paymentPlan') {
                // Filter installments based on maxInstallmentFilter
                let filteredInstallments = block.data?.installments || [];
                if (paymentPlanConfig.maxInstallmentFilter) {
                  filteredInstallments = filteredInstallments.filter((inst: any) => 
                    inst.number <= paymentPlanConfig.maxInstallmentFilter!
                  );
                }
                
                return {
                  ...block,
                  data: {
                    ...block.data,
                    installments: filteredInstallments
                  },
                  config: paymentPlanConfig
                }
              }
              
              return block;
            })} config={pdfConfig} footerConfig={debouncedFooterConfig} tableConfig={debouncedTableConfig} headerConfig={debouncedHeaderConfig} />}
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