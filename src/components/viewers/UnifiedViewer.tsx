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
  Maximize,
  RotateCw,
  RotateCcw
} from 'lucide-react';
import { storageHelpers } from '@/lib/supabase/storage';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type UnifiedViewerProps = {
  bucket: string;
  path: string;
  fileName?: string;
  fileType?: string;
  useSignedUrl?: boolean;
  className?: string;
  onExpand?: () => void;
  height?: number;
};

type ViewerState = {
  loading: boolean;
  error: string | null;
  fileType: 'pdf' | 'image' | 'unknown';
  
  // PDF specific
  page: number;
  numPages: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  
  // Image specific
  imageUrl: string | null;
  naturalWidth: number;
  naturalHeight: number;
  rotation: number;
  
  // Common
  scale: number;
  blob: Blob | null;
};

export function UnifiedViewer({ 
  bucket, 
  path, 
  fileName = 'document', 
  fileType,
  useSignedUrl = false,
  className = "",
  onExpand,
  height = 520
}: UnifiedViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<ViewerState>({
    loading: true,
    error: null,
    fileType: 'unknown',
    page: 1,
    numPages: 0,
    pdfDoc: null,
    imageUrl: null,
    naturalWidth: 0,
    naturalHeight: 0,
    rotation: 0,
    scale: 0.6, // Start at 60% for better initial view
    blob: null
  });

  // Detect file type
  const detectFileType = useCallback((mimeType: string): 'pdf' | 'image' | 'unknown' => {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    return 'unknown';
  }, []);

  // Load file
  const loadFile = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let blob: Blob;
      let mimeType: string;

      if (useSignedUrl) {
        const signedUrl = await storageHelpers.createSignedUrl(bucket, path, 3600);
        const response = await fetch(signedUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        blob = await response.blob();
        mimeType = response.headers.get('Content-Type') || fileType || 'application/octet-stream';
      } else {
        blob = await storageHelpers.downloadAsBlob(bucket, path);
        mimeType = fileType || blob.type || 'application/octet-stream';
      }

      const detectedType = detectFileType(mimeType);
      
      setState(prev => ({ 
        ...prev, 
        blob, 
        fileType: detectedType,
        loading: false 
      }));

      // Load based on type
      if (detectedType === 'pdf') {
        await loadPdfFromBlob(blob);
      } else if (detectedType === 'image') {
        await loadImageFromBlob(blob);
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido al cargar archivo'
      }));
    }
  }, [bucket, path, useSignedUrl, fileType, detectFileType]);

  // Load PDF from blob
  const loadPdfFromBlob = async (blob: Blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Calculate base scale for fit-to-width
      const firstPage = await pdfDoc.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      const containerWidth = 560; // Available width
      const baseScale = containerWidth / viewport.width;
      
      setState(prev => ({
        ...prev,
        pdfDoc,
        numPages: pdfDoc.numPages,
        page: 1,
        baseScale: baseScale,
        scale: 1.0 // This represents the relative zoom from the fit-to-width base
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error al cargar PDF'
      }));
    }
  };

  // Load image from blob
  const loadImageFromBlob = async (blob: Blob) => {
    try {
      const imageUrl = URL.createObjectURL(blob);
      
      // Create image element to get dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      setState(prev => ({
        ...prev,
        imageUrl,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        rotation: 0
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error al cargar imagen'
      }));
    }
  };

  // Render PDF page
  const renderPage = useCallback(async () => {
    if (!state.pdfDoc || !canvasRef.current || state.loading) return;

    try {
      const page = await state.pdfDoc.getPage(state.page);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      // Use the user's scale directly (1.0 = 100% natural size)
      const scaledViewport = page.getViewport({ scale: state.scale });
      
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
        canvas: canvas
      };

      await page.render(renderContext).promise;
    } catch (error) {
    }
  }, [state.pdfDoc, state.page, state.scale]);

  // Navigation functions
  const nextPage = () => {
    if (state.page < state.numPages) {
      setState(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const prevPage = () => {
    if (state.page > 1) {
      setState(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };

  // Zoom functions - increment by 10% each time
  const zoomIn = () => setState(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 5.0) }));
  const zoomOut = () => setState(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.2) }));
  const zoom100 = () => setState(prev => ({ ...prev, scale: 1.0 }));

  // Image rotation
  const rotateLeft = () => setState(prev => ({ ...prev, rotation: (prev.rotation - 90) % 360 }));
  const rotateRight = () => setState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));

  // Download
  const downloadFile = () => {
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
  };

  // Effects
  useEffect(() => {
    loadFile();
  }, [loadFile]);

  useEffect(() => {
    if (state.fileType === 'pdf' && state.pdfDoc && !state.loading) {
      renderPage();
    }
  }, [renderPage, state.fileType, state.pdfDoc, state.loading]);

  // Loading state
  if (state.loading) {
    return (
      <div 
        className={`relative bg-muted/50 overflow-auto ${className}`}
        style={{ height: `${height}px` }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Skeleton className="w-32 h-32 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Cargando archivo...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div 
        className={`relative bg-muted/50 flex items-center justify-center overflow-auto ${className}`}
        style={{ height: `${height}px` }}
      >
        <div className="text-center p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4 mx-auto" />
          <h3 className="text-lg font-semibold mb-2">Error al cargar archivo</h3>
          <p className="text-muted-foreground mb-6 max-w-md">{state.error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={loadFile} variant="outline">
              Reintentar
            </Button>
            <Button onClick={downloadFile} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Unknown file type
  if (state.fileType === 'unknown') {
    return (
      <div 
        className={`relative bg-muted/50 flex items-center justify-center overflow-auto ${className}`}
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">Vista previa no disponible</h4>
          <p className="text-muted-foreground mb-4">
            Este tipo de archivo no se puede mostrar en el navegador
          </p>
          <Button onClick={downloadFile}>
            <Download className="w-4 h-4 mr-2" />
            Descargar archivo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative group bg-muted/50 ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* Floating Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg shadow-lg">
          
          {/* PDF Navigation */}
          {state.fileType === 'pdf' && (
            <>
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
            </>
          )}

          {/* Zoom Controls */}
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
            {Math.round(state.scale * state.baseScale * 100)}%
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

          {/* Image Rotation */}
          {state.fileType === 'image' && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={rotateLeft}
                className=""
                title="Rotar izquierda"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={rotateRight}
                className=""
                title="Rotar derecha"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </>
          )}

          <div className="w-px h-4 bg-border mx-1" />
          
          {/* Actions */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={zoom100}
            className=""
            title="Ajustar"
          >
            <Maximize className="w-4 h-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={downloadFile}
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
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>

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

      {/* Content Area - Fixed height scrollable area */}
      <div 
        className="absolute inset-0 overflow-auto"
        style={{ paddingTop: '60px' }} // Account for floating toolbar
      >
        {state.fileType === 'pdf' && (
          <div className="p-4 min-h-full flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded border">
              <canvas 
                ref={canvasRef}
                className="block"
                style={{ display: 'block' }}
              />
            </div>
          </div>
        )}

        {state.fileType === 'image' && state.imageUrl && (
          <div className="p-4 min-h-full flex justify-center items-start">
            <img
              ref={imageRef}
              src={state.imageUrl}
              alt={fileName}
              className="max-w-none"
              style={{
                transform: `scale(${state.scale}) rotate(${state.rotation}deg)`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease-in-out'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}