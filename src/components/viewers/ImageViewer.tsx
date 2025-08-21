import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  ExternalLink,
  AlertCircle,
  Maximize,
  RotateCw,
  RotateCcw
} from 'lucide-react';
import { storageHelpers } from '@/lib/supabase/storage';

type ImageViewerProps = {
  bucket: string;
  path: string;
  fileName?: string;
  useSignedUrl?: boolean;
  className?: string;
  onExpand?: () => void;
  height?: number;
};

type ImageState = {
  loading: boolean;
  error: string | null;
  scale: number;
  rotation: number;
  blob: Blob | null;
  imageUrl: string | null;
  naturalWidth: number;
  naturalHeight: number;
};

export function ImageViewer({ 
  bucket, 
  path, 
  fileName = 'image', 
  useSignedUrl = false,
  className = "",
  onExpand,
  height = 520
}: ImageViewerProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<ImageState>({
    loading: true,
    error: null,
    scale: 1.0,
    rotation: 0,
    blob: null,
    imageUrl: null,
    naturalWidth: 0,
    naturalHeight: 0
  });

  // Container dimensions for fit calculations
  const CONTAINER_WIDTH = 800;
  const CONTAINER_HEIGHT = 450;

  // Load image
  useEffect(() => {
    let isMounted = true;
    let currentImageUrl: string | null = null;
    
    const loadImage = async () => {
      try {
        if (!isMounted) return;
        setState(prev => ({ ...prev, loading: true, error: null }));

        // For images, try to use the direct URL first
        let imageUrl: string;
        
        if (useSignedUrl || !path.startsWith('http')) {
          // Use storage helpers for bucket files
          try {
            const publicUrl = storageHelpers.getPublicUrl(bucket, path);
            imageUrl = publicUrl;
          } catch (error) {
            console.error('Error getting public URL:', error);
            throw new Error('No se pudo obtener la URL de la imagen');
          }
        } else {
          // Use direct URL if path is already a URL
          imageUrl = path;
        }

        // Load image to get natural dimensions
        const img = new Image();
        img.onload = () => {
          if (!isMounted) return;
          
          const fitToWidthScale = Math.min(1.0, CONTAINER_WIDTH / img.naturalWidth);
          
          setState(prev => ({
            ...prev,
            loading: false,
            blob: null, // No blob needed for direct URL
            imageUrl,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            scale: fitToWidthScale
          }));
        };
        
        img.onerror = () => {
          if (!isMounted) return;
          
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Error al cargar la imagen'
          }));
        };
        
        img.src = imageUrl;

      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error loading image:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido al cargar imagen'
        }));
      }
    };

    loadImage();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
      }
    };
  }, [bucket, path, useSignedUrl]);

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
    if (state.naturalWidth === 0) return;
    const fitToWidthScale = Math.min(1.0, CONTAINER_WIDTH / state.naturalWidth);
    setState(prev => ({ ...prev, scale: fitToWidthScale }));
  };

  const rotateLeft = () => {
    setState(prev => ({ 
      ...prev, 
      rotation: (prev.rotation - 90) % 360 
    }));
  };

  const rotateRight = () => {
    setState(prev => ({ 
      ...prev, 
      rotation: (prev.rotation + 90) % 360 
    }));
  };

  const downloadImage = () => {
    if (!state.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = state.imageUrl;
    link.download = fileName;
    link.click();
  };

  const openInNewTab = () => {
    if (!state.imageUrl) return;
    window.open(state.imageUrl, '_blank');
  };

  if (state.loading) {
    return (
      <div 
        className={`relative bg-muted/50 overflow-auto ${className}`}
        style={{ height: `${height}px` }}
      >
        <Skeleton className="h-full w-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando imagen...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div 
        className={`relative bg-muted/50 flex items-center justify-center overflow-auto ${className}`}
        style={{ height: `${height}px` }}
      >
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">Error al cargar imagen</h4>
          <p className="text-muted-foreground text-sm">{state.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative group bg-muted/50 overflow-auto ${className}`}
      style={{ height: `${height}px` }}
    >
      <div className="h-full overflow-auto flex items-center justify-center p-4">
        {state.imageUrl && (
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
        )}
      </div>

      {/* Floating toolbar - appears on hover like PDF viewer */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg shadow-lg">
          {/* Zoom controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={state.scale <= 0.1}
            className=""
            title="Reducir zoom"
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
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Rotation controls */}
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
            onClick={downloadImage}
            className=""
            title="Descargar"
          >
            <Download className="w-4 h-4" />
          </Button>

          {onExpand && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onExpand}
              className=""
              title="Expandir"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}