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
  AlertCircle 
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
  className = "" 
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

      setState(prev => ({
        ...prev,
        loading: false,
        blob,
        pdfDoc,
        numPages: pdfDoc.numPages,
        page: Math.min(prev.page, pdfDoc.numPages)
      }));

    } catch (error) {
      console.error('Error loading PDF:', error);
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
      const viewport = page.getViewport({ scale: state.scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Set canvas size
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Render page
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;

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
      scale: Math.min(prev.scale * 1.25, 3.0) 
    }));
  };

  const zoomOut = () => {
    setState(prev => ({ 
      ...prev, 
      scale: Math.max(prev.scale * 0.8, 0.5) 
    }));
  };

  const resetZoom = () => {
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
            resetZoom();
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
    if (state.pdfDoc && !state.loading) {
      renderPage();
    }
  }, [renderPage, state.pdfDoc, state.loading]);

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
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
        <div className="flex items-center justify-between">
          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={prevPage}
              disabled={state.page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2 px-3">
              <span className="text-sm font-medium">{state.page}</span>
              <span className="text-sm text-muted-foreground">de</span>
              <span className="text-sm font-medium">{state.numPages}</span>
            </div>
            
            <Button
              variant="default"
              size="sm"
              onClick={nextPage}
              disabled={state.page >= state.numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom and actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={zoomOut}
              disabled={state.scale <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <Badge 
              variant="outline" 
              className="px-3 cursor-pointer hover:bg-accent"
              onClick={resetZoom}
            >
              {Math.round(state.scale * 100)}%
            </Badge>
            
            <Button
              variant="default"
              size="sm"
              onClick={zoomIn}
              disabled={state.scale >= 3.0}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <Button variant="default" size="sm" onClick={downloadPdf}>
              <Download className="w-4 h-4" />
            </Button>
            
            <Button variant="default" size="sm" onClick={openInNewTab}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
        <div className="flex justify-center items-start p-4" style={{ minHeight: 'fit-content' }}>
          <canvas
            ref={canvasRef}
            className="shadow-lg rounded-lg bg-white"
            style={{
              display: 'block',
              maxWidth: 'none', // Permite que el canvas se expanda más allá del contenedor
              width: 'auto',
              height: 'auto'
            }}
          />
        </div>
      </div>
    </div>
  );
}