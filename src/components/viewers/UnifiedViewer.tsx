import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { storageHelpers } from '@/lib/supabase/storage';
import { useViewportZoom } from './useViewportZoom';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize
} from 'lucide-react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export type UnifiedViewerProps = {
  bucket: string;
  path: string;          // storage_path o URL completa
  mimeType?: string;     // ej. 'application/pdf', 'image/png', 'application/dxf'
  fileName?: string;     // para descargar
  useSignedUrl?: boolean; // si el bucket es privado
  className?: string;
  onExpand?: () => void;
  height?: number;        // alto fijo del visor (px). default 520
};

type FileType = 'pdf' | 'image' | 'dxf' | 'dwg' | 'unknown';

function detectFileType(mimeType?: string, path?: string): FileType {
  if (mimeType) {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/dxf' || mimeType === 'image/vnd.dxf') return 'dxf';
  }
  
  if (path) {
    const ext = path.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'png': case 'jpg': case 'jpeg': case 'webp': case 'svg': return 'image';
      case 'dxf': return 'dxf';
      case 'dwg': return 'dwg';
    }
  }
  
  return 'unknown';
}

export function UnifiedViewer({
  bucket,
  path,
  mimeType,
  fileName,
  useSignedUrl = false,
  className,
  onExpand,
  height = 520
}: UnifiedViewerProps) {
  const [containerRef, containerDimensions] = useResizeObserver<HTMLDivElement>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [fileUrl, setFileUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [fileType, setFileType] = useState<FileType>('unknown');
  
  // PDF-specific state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  
  // Image-specific state
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [baseImageSize, setBaseImageSize] = useState({ width: 0, height: 0 });
  
  const { scale, setScale, reset, fitToWidth, zoomIn, zoomOut, onWheel } = useViewportZoom(1);

  // Get file URL based on bucket type
  const getFileUrl = useCallback(async () => {
    try {
      if (useSignedUrl) {
        return await storageHelpers.createSignedUrl(bucket, path);
      } else {
        return storageHelpers.getPublicUrl(bucket, path);
      }
    } catch (err) {
      throw new Error('Failed to get file URL');
    }
  }, [bucket, path, useSignedUrl]);

  // Initialize file URL and type
  useEffect(() => {
    const initFile = async () => {
      try {
        setLoading(true);
        setError('');
        
        const url = await getFileUrl();
        setFileUrl(url);
        
        const detectedType = detectFileType(mimeType, path);
        setFileType(detectedType);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading file');
      } finally {
        setLoading(false);
      }
    };

    initFile();
  }, [bucket, path, mimeType, useSignedUrl, getFileUrl]);

  // PDF rendering
  const renderPDFPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || containerDimensions.width === 0) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Calculate base scale to fit width
      const viewport = page.getViewport({ scale: 1 });
      const newBaseScale = containerDimensions.width / viewport.width;
      setBaseScale(newBaseScale);
      
      // Render at base scale with device pixel ratio for sharpness
      const renderScale = newBaseScale * window.devicePixelRatio;
      const renderViewport = page.getViewport({ scale: renderScale });
      
      canvas.height = renderViewport.height;
      canvas.width = renderViewport.width;
      
      // Set CSS size to base scale (no zoom applied here)
      canvas.style.width = `${viewport.width * newBaseScale}px`;
      canvas.style.height = `${viewport.height * newBaseScale}px`;
      
      await page.render({
        canvasContext: ctx,
        viewport: renderViewport
      }).promise;
      
    } catch (err) {
      console.error('Error rendering PDF page:', err);
    }
  }, [pdfDoc, containerDimensions.width]);

  // Load PDF
  useEffect(() => {
    if (fileType !== 'pdf' || !fileUrl) return;

    const loadPDF = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        setError('Failed to load PDF');
      }
    };

    loadPDF();
  }, [fileType, fileUrl]);

  // Render PDF page when dependencies change
  useEffect(() => {
    if (fileType === 'pdf' && pdfDoc) {
      renderPDFPage(currentPage);
    }
  }, [fileType, pdfDoc, currentPage, containerDimensions.width, renderPDFPage]);

  // Handle image loading
  useEffect(() => {
    if (fileType !== 'image' || !fileUrl || !imgRef.current) return;

    const img = imgRef.current;
    
    const handleImageLoad = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      setImageNaturalSize({ width: naturalWidth, height: naturalHeight });
      
      // Calculate base size to fit width
      const baseWidth = containerDimensions.width || naturalWidth;
      const baseHeight = baseWidth * (naturalHeight / naturalWidth);
      setBaseImageSize({ width: baseWidth, height: baseHeight });
    };

    img.addEventListener('load', handleImageLoad);
    return () => img.removeEventListener('load', handleImageLoad);
  }, [fileType, fileUrl, containerDimensions.width]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            reset();
            break;
        }
      }
      
      // PDF navigation
      if (fileType === 'pdf') {
        switch (e.key) {
          case 'ArrowLeft':
            if (currentPage > 1) {
              setCurrentPage(prev => prev - 1);
            }
            break;
          case 'ArrowRight':
            if (currentPage < numPages) {
              setCurrentPage(prev => prev + 1);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileType, currentPage, numPages, zoomIn, zoomOut, reset]);

  // Download file
  const handleDownload = useCallback(async () => {
    try {
      if (useSignedUrl) {
        const blob = await storageHelpers.downloadAsBlob(bucket, path);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'download';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName || 'download';
        a.click();
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [useSignedUrl, bucket, path, fileName, fileUrl]);

  // Open in new tab
  const handleOpenExternal = useCallback(() => {
    window.open(fileUrl, '_blank');
  }, [fileUrl]);

  // Handle Autodesk Viewer for DWG
  const openWithAutodeskViewer = useCallback((fileUrl: string) => {
    // TODO: integrar token y carga del modelo
    console.log('Opening with Autodesk Viewer:', fileUrl);
    alert('Autodesk Viewer integration coming soon');
  }, []);

  // Fit to width
  const handleFitToWidth = useCallback(() => {
    if (fileType === 'pdf' && baseScale > 0) {
      fitToWidth(containerDimensions.width / baseScale, containerDimensions.width);
    } else if (fileType === 'image' && imageNaturalSize.width > 0) {
      fitToWidth(imageNaturalSize.width, containerDimensions.width);
    }
  }, [fileType, baseScale, containerDimensions.width, imageNaturalSize.width, fitToWidth]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/40 rounded-xl border", className)} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/40 rounded-xl border", className)} style={{ height }}>
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">Error: {error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("viewer-root relative", className)} style={{ height }}>
      {/* Main viewer area */}
      <div
        ref={scrollRef}
        className="viewer-scroll overflow-auto relative bg-muted/40 rounded-xl border h-full"
        onWheel={(e) => onWheel(e.nativeEvent)}
      >
        <div
          ref={contentRef}
          className="viewer-content inline-block origin-top-left"
          style={{ transform: `scale(${scale})` }}
        >
          {/* PDF Content */}
          {fileType === 'pdf' && (
            <canvas
              ref={canvasRef}
              className="block"
              style={{
                maxWidth: 'none',
                imageRendering: 'pixelated'
              }}
            />
          )}

          {/* Image Content */}
          {fileType === 'image' && (
            <img
              ref={imgRef}
              src={fileUrl}
              alt={fileName || 'Document'}
              className="block"
              style={{
                width: baseImageSize.width,
                height: baseImageSize.height,
                maxWidth: 'none'
              }}
            />
          )}

          {/* DXF Content */}
          {fileType === 'dxf' && (
            <div className="flex items-center justify-center p-8 bg-white rounded border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  DXF viewer coming soon
                </p>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download DXF
                </Button>
              </div>
            </div>
          )}

          {/* DWG Fallback */}
          {fileType === 'dwg' && (
            <div className="flex items-center justify-center p-8 bg-white rounded border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Formato DWG no soportado nativamente.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openWithAutodeskViewer(fileUrl)}
                  className="mb-2"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir con Autodesk Viewer
                </Button>
                <br />
                <Button variant="ghost" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar DWG
                </Button>
              </div>
            </div>
          )}

          {/* Unknown file type */}
          {fileType === 'unknown' && (
            <div className="flex items-center justify-center p-8 bg-white rounded border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Tipo de archivo no soportado
                </p>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar archivo
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          {/* PDF Navigation */}
          {fileType === 'pdf' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-xs text-white px-2 min-w-16 text-center">
                {currentPage} / {numPages}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-4 bg-white/20 mx-1" />
            </>
          )}

          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-8 px-2 text-white hover:bg-white/20"
          >
            <span className="text-xs">{Math.round(scale * 100)}%</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitToWidth}
            className="h-8 px-2 text-white hover:bg-white/20"
          >
            <span className="text-xs">Fit</span>
          </Button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Action buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          {onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpand}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}