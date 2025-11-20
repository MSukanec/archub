import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { uploadCourseImage, deleteCourseImage, updateCourseImageUrl } from '@/lib/storage/uploadCourseImage';

interface CourseHeroImageUploadProps {
  courseId: string;
  currentImageUrl?: string | null;
  onImageUpdate?: (imageUrl: string | null) => void;
}

export default function CourseHeroImageUpload({
  courseId,
  currentImageUrl,
  onImageUpdate
}: CourseHeroImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      
      const uploadResult = await uploadCourseImage(file, courseId);
      await updateCourseImageUrl(courseId, uploadResult.file_url);
      
      return uploadResult.file_url;
    },
    onSuccess: (imageUrl) => {
      toast({
        title: "Éxito",
        description: "Imagen del curso actualizada correctamente"
      });
      onImageUpdate?.(imageUrl);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
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
        // Remove query string (cache-busting) from URL before extracting extension
        const cleanUrl = currentImageUrl.split('?')[0];
        const urlParts = cleanUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const extension = fileName.split('.').pop();
        const filePath = `${courseId}/hero.${extension}`;
        
        await deleteCourseImage(filePath);
        await updateCourseImageUrl(courseId, null);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito", 
        description: "Imagen del curso eliminada correctamente"
      });
      onImageUpdate?.(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
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
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive"
      });
      return;
    }
    
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
            <img
              src={currentImageUrl}
              alt="Imagen del curso"
              className="w-full h-full object-cover"
              key={currentImageUrl}
            />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => document.getElementById('course-hero-image-input')?.click()}
                  disabled={isUploading}
                  data-testid="button-change-course-image"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Cambiar
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  data-testid="button-remove-course-image"
                >
                  <X className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div 
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-[var(--accent)] hover:border-[var(--accent)]/80 transition-colors rounded-lg"
            onClick={() => document.getElementById('course-hero-image-input')?.click()}
          >
            <div className="text-center space-y-4 p-8">
              <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center border border-muted-foreground/20">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground max-w-sm">
                  Arrastra una imagen aquí o haz clic para seleccionar la imagen del curso
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos: JPG, PNG, WebP • Tamaño máximo: 10MB
                </p>
              </div>
              <Button disabled={isUploading} variant="default" data-testid="button-upload-course-image">
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Subiendo...' : 'Seleccionar Imagen'}
              </Button>
            </div>
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm font-medium">Subiendo imagen...</span>
            </div>
          </div>
        )}
      </div>

      <input
        id="course-hero-image-input"
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
