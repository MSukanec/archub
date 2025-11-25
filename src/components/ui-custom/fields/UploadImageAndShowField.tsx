import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { uploadProjectImage, deleteProjectImage, updateProjectImageUrl } from '@/features/projects';
import { compressImage, formatCompressionStats } from '@/lib/imageCompression';

interface ImageUploadAndShowFieldProps {
  projectId?: string;
  organizationId?: string;
  currentImageUrl?: string | null;
  imageBucket?: string | null;
  imagePath?: string | null;
  onImageUpdate?: (imageUrl: string | null) => void;
  previewMode?: boolean;
  onFileSelect?: (file: File | null) => void;
  previewUrl?: string | null;
}

export default function ImageUploadAndShowField({
  projectId,
  organizationId,
  currentImageUrl,
  imageBucket,
  imagePath,
  onImageUpdate,
  previewMode = false,
  onFileSelect,
  previewUrl
}: ImageUploadAndShowFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!projectId || !organizationId) {
        throw new Error('Project ID and Organization ID are required');
      }
      
      setIsUploading(true);
      
      // Upload image to storage (now saves bucket+path internally)
      const uploadResult = await uploadProjectImage(file, projectId, organizationId);
      
      return uploadResult.file_url;
    },
    onSuccess: (imageUrl) => {
      toast({
        title: "Éxito",
        description: "Imagen principal actualizada correctamente"
      });
      onImageUpdate?.(imageUrl);
      // Invalidate multiple cache keys to update all views
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
        queryClient.invalidateQueries({ queryKey: ['project-info', projectId] });
      }
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!projectId || !organizationId) {
        throw new Error('Project ID and Organization ID are required');
      }
      
      // Use metadata (bucket + path) instead of deriving from URL
      if (imageBucket && imagePath) {
        await deleteProjectImage(projectId, organizationId, imageBucket, imagePath);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito", 
        description: "Imagen principal eliminada correctamente"
      });
      onImageUpdate?.(null);
      // Invalidate multiple cache keys to update all views
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
        queryClient.invalidateQueries({ queryKey: ['project-info', projectId] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la imagen",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive"
      });
      return;
    }
    
    // Preview mode: just notify parent with file
    if (previewMode && onFileSelect) {
      onFileSelect(file);
      return;
    }
    
    // Normal mode: compress and upload
    if (projectId && organizationId) {
      try {
        setIsCompressing(true);
        const originalSize = file.size;
        
        // Compress image before uploading
        const compressedFile = await compressImage(file, 'project-cover');
        
        setIsCompressing(false);
        
        // Validate file size AFTER compression (max 2MB)
        if (compressedFile.size > 2 * 1024 * 1024) {
          toast({
            title: "Error", 
            description: "La imagen no puede superar los 2MB",
            variant: "destructive"
          });
          return;
        }
        
        // Show compression stats if there was significant reduction
        if (originalSize !== compressedFile.size) {
          toast({
            title: "Imagen optimizada",
            description: formatCompressionStats(originalSize, compressedFile.size),
          });
        }
        
        uploadMutation.mutate(compressedFile);
      } catch (error) {
        setIsCompressing(false);
        toast({
          title: "Advertencia",
          description: "No se pudo comprimir la imagen, se usará el archivo original",
          variant: "default"
        });
        
        // Validate file size AFTER compression failure (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          toast({
            title: "Error",
            description: "La imagen no puede superar los 2MB",
            variant: "destructive"
          });
          return;
        }
        
        uploadMutation.mutate(file);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  // In preview mode: show new preview if selected, otherwise show current image
  // In normal mode: show current image
  const displayUrl = previewMode ? (previewUrl || currentImageUrl) : currentImageUrl;
  const handleRemove = () => {
    if (previewMode && onFileSelect) {
      onFileSelect(null);
    } else if (!previewMode) {
      removeMutation.mutate();
    }
  };

  return (
    <div className="w-full">
      {/* Hero Image Container */}
      <div 
        className={`relative w-full h-64 md:h-80 rounded-lg overflow-hidden transition-colors ${
          dragActive ? 'bg-primary/10' : 'bg-muted/30'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {displayUrl ? (
          <>
            {/* Existing Image */}
            <img
              src={displayUrl}
              alt="Imagen principal del proyecto"
              className="w-full h-full object-cover"
              key={displayUrl} // Force re-render when URL changes
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    document.getElementById('hero-image-input')?.click();
                  }}
                  disabled={isUploading && !previewMode}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Cambiar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove();
                  }}
                  disabled={removeMutation.isPending && !previewMode}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* No Image Placeholder - styled like EmptyState */}
            <div 
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-[var(--accent)] hover:border-[var(--accent)]/80 transition-colors rounded-lg hover:bg-muted/20"
              onClick={() => document.getElementById('hero-image-input')?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById('hero-image-input')?.click();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="text-center space-y-4 p-8">
                <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center border border-muted-foreground/20">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Arrastra una imagen aquí o haz clic para seleccionar la imagen principal de tu proyecto
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formatos: JPG, PNG, WebP • Tamaño máximo: 2MB
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Loading overlay */}
        {(isUploading || isCompressing) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm font-medium">
                {isCompressing ? 'Comprimiendo imagen...' : 'Subiendo imagen...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        id="hero-image-input"
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}