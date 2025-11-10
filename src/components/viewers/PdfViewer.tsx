import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  ExternalLink,
  FileText,
  AlertCircle,
  Maximize2,
  Maximize 
} from 'lucide-react';
import { storageHelpers } from '@/lib/supabase/storage';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type PdfViewerProps = {
  bucket: string;
  path: string;
  fileName?: string;
  useSignedUrl?: boolean;
  className?: string;
  onExpand?: () => void;
  height?: number;
};

type PdfState = {
  loading: boolean;
  error: string | null;
  page: number;
  numPages: number;
  scale: number;
  blob: Blob | null;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
};

export function PdfViewer({ 
  bucket, 
  path, 
  fileName = 'document.pdf', 
  useSignedUrl = false,
  className = "",
  onExpand,
  height = 520
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<PdfState>({
    loading: true,
    error: null,
    page: 1,
    numPages: 0,
    scale: 1.0,
    blob: null,
    pdfDoc: null
  });

  // Container dimensions for fit calculations
  const CONTAINER_WIDTH = 800; // Available width for PDF content
  const CONTAINER_HEIGHT = 450; // Available height for PDF content
  
  // Base scale for fit-to-width calculation (this is the reference scale)
  const [baseScale, setBaseScale] = useState(1.0);

  // Load PDF document
  const loadPdf = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      let blob: Blob;
      
      if (useSignedUrl) {
        // For private buckets
        blob = await storageHelpers.downloadAsBlob(bucket, path);
      } else {
        // For public buckets
        const publicUrl = storageHelpers.getPublicUrl(bucket, path);
        blob = await storageHelpers.fetchAsBlob(publicUrl);
      }

      const arrayBuffer = await blob.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Calculate base scale to fit width (this will be the rendering scale)
      const firstPage = await pdfDoc.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1.0 });
      const fitToWidthScale = Math.min(1.0, CONTAINER_WIDTH / viewport.width);
      
      setBaseScale(fitToWidthScale);

      setState(prev => ({
        ...prev,
        loading: false,
        blob,
        pdfDoc,
        numPages: pdfDoc.numPages,
        page: Math.min(prev.page, pdfDoc.numPages),
        scale: 1.0 // Start with 100% zoom for display
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido al cargar PDF'
      }));
    }
  }, [bucket, path, useSignedUrl]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!state.pdfDoc || !canvasRef.current) return;

    try {
      const page = await state.pdfDoc.getPage(state.page);
      // Render at the actual zoom scale for crisp quality
      const actualScale = baseScale * state.scale;
      const viewport = page.getViewport({ scale: actualScale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Set canvas size to match viewport exactly
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      };
      await page.render(renderContext).promise;

    } catch (error) {
    }
  }, [state.pdfDoc, state.page, baseScale, state.scale]);

  // Navigation functions
  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= state.numPages) {
      setState(prev => ({ ...prev, page: pageNum }));
    }
  };

  const nextPage = () => goToPage(state.page + 1);
  const prevPage = () => goToPage(state.page - 1);

  // Zoom functions - 10% increments
  const zoomIn = () => {
    setState(prev => ({ 
      ...prev, 
      scale: Math.min(prev.scale + 0.1, 3.0) 
    }));
  };

  const zoomOut = () => {
    setState(prev => ({ 
      ...prev, 
      scale: Math.max(prev.scale - 0.1, 0.1) 
    }));
  };

  const zoom100 = () => {
    setState(prev => ({ ...prev, scale: 1.0 }));
  };

  const fitToWidth = () => {
    // Reset to 100% zoom (fit to width is already handled by baseScale)
    setState(prev => ({ ...prev, scale: 1.0 }));
  };

  // Download function
  const downloadPdf = () => {
    if (!state.blob) return;
    
    const url = URL.createObjectURL(state.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Open in new tab
  const openInNewTab = () => {
    if (!state.blob) return;
    
    const url = URL.createObjectURL(state.blob);
    window.open(url, '_blank');
    // Note: URL will be revoked when user closes tab
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextPage();
          break;
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            fitToWidth();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.page, state.numPages]);

  // Load PDF on mount or when props change
  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // Render page when page or scale changes
  useEffect(() => {
    if (state.pdfDoc && !state.loading && baseScale > 0) {
      renderPage();
    }
  }, [renderPage, state.pdfDoc, state.loading, baseScale]);

  if (state.loading) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* Toolbar skeleton */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
        
        {/* Canvas skeleton */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Skeleton className="w-full max-w-4xl h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error al cargar PDF</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {state.error}
          </p>
          <div className="flex gap-3">
            <Button onClick={loadPdf} variant="outline">
              Reintentar
            </Button>
            <Button onClick={downloadPdf} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative group overflow-auto ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* Floating Toolbar - Centered and compact */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg shadow-lg">
          {/* Page navigation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={prevPage}
            disabled={state.page <= 1}
            className=""
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
            className=""
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Zoom */}
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={state.scale <= 0.1}
            className=""
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
            className=""
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />
          
          {/* Actions */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fitToWidth}
            className=""
            title="Ajustar al ancho"
          >
            <Maximize className="w-4 h-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={downloadPdf}
            className=""
            title="Descargar"
          >
            <Download className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={openInNewTab}
            className=""
            title="Compartir"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>

          {/* Expand Button - Inside action bar */}
          {onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpand}
              className=""
              title="Expandir"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* PDF Canvas Container - Fixed size with scroll */}
      <div 
        className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900"
        style={{ 
          minHeight: 0 // Important for flex child to shrink
        }}
      >
        <div className="p-4 flex justify-center">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded border">
            <canvas 
              ref={canvasRef}
              className="block"
              style={{ 
                display: 'block'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}