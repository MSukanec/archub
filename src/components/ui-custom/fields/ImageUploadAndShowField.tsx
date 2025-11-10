import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { uploadProjectImage, deleteProjectImage, updateProjectImageUrl } from '@/lib/storage/uploadProjectImage';

interface ImageUploadAndShowFieldProps {
  projectId: string;
  organizationId: string;
  currentImageUrl?: string | null;
  onImageUpdate?: (imageUrl: string | null) => void;
}

export default function ImageUploadAndShowField({
  projectId,
  organizationId,
  currentImageUrl,
  onImageUpdate
}: ImageUploadAndShowFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      
      // Upload image to storage
      const uploadResult = await uploadProjectImage(file, projectId, organizationId);
      
      // Update project_data table with new image URL
      await updateProjectImageUrl(projectId, uploadResult.file_url);
      
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
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-info', projectId] });
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
      if (currentImageUrl) {
        // Extract file path from URL for deletion
        const urlParts = currentImageUrl.split('/');
        const filePath = `${organizationId}/${projectId}/hero.${urlParts[urlParts.length - 1].split('.').pop()}`;
        
        await deleteProjectImage(filePath);
        await updateProjectImageUrl(projectId, null);
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
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-info', projectId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la imagen",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (files: FileList | null) => {
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
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "La imagen no puede superar los 10MB",
        variant: "destructive"
      });
      return;
    }
    
    uploadMutation.mutate(file);
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
        {currentImageUrl ? (
          <>
            {/* Existing Image */}
            <img
              src={currentImageUrl}
              alt="Imagen principal del proyecto"
              className="w-full h-full object-cover"
              key={currentImageUrl} // Force re-render when URL changes
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() => document.getElementById('hero-image-input')?.click()}
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Cambiar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
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
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-[var(--accent)] hover:border-[var(--accent)]/80 transition-colors rounded-lg"
              onClick={() => document.getElementById('hero-image-input')?.click()}
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
                    Formatos: JPG, PNG, WebP • Tamaño máximo: 10MB
                  </p>
                </div>
                <Button disabled={isUploading} variant="default">
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Subiendo...' : 'Seleccionar Imagen'}
                </Button>
              </div>
            </div>
          </>
        )}
        
        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm font-medium">Subiendo imagen...</span>
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