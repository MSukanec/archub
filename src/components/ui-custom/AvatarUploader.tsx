import { useState, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface AvatarUploaderProps {
  currentImageUrl?: string;
  fallbackText: string;
  bucketName: string;
  uploadPath: string;
  onUploadSuccess: (imageUrl: string) => void;
  title: string;
  description: string;
  maxSizeMB?: number;
}

export function AvatarUploader({
  currentImageUrl,
  fallbackText,
  bucketName,
  uploadPath,
  onUploadSuccess,
  title,
  description,
  maxSizeMB = 5,
}: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Function to resize and crop image to square
  const resizeImageToSquare = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Set canvas to fixed 400x400 size
        const canvasSize = 400;
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        // Fill with white background first (important for JPEGs)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        // Calculate scale to fit the entire image within the canvas, maintaining aspect ratio
        const scale = Math.min(canvasSize / img.width, canvasSize / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Calculate position to center the scaled image in the canvas
        const offsetX = (canvasSize - scaledWidth) / 2;
        const offsetY = (canvasSize - scaledHeight) / 2;
        
        // Draw the complete image scaled and centered in the square canvas
        ctx.drawImage(
          img,
          0, 0, img.width, img.height,  // source rectangle (entire image)
          offsetX, offsetY, scaledWidth, scaledHeight  // destination rectangle (scaled and centered)
        );
        
        // Convert canvas to blob with higher quality
        canvas.toBlob((blob) => {
          if (blob) {
            const squareFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(squareFile);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/jpeg', 0.95);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive"
      });
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "Error",
        description: `El archivo es demasiado grande. Máximo ${maxSizeMB}MB.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);

      // Resize and crop image to square
      const squareFile = await resizeImageToSquare(file);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(uploadPath, squareFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL with timestamp to avoid cache issues
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadPath);

      // Add timestamp to avoid browser caching issues
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;



      // Call success callback
      onUploadSuccess(publicUrl);

      setShowUpload(false);
      toast({
        title: "Imagen subida",
        description: "La imagen se ha actualizado correctamente",
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Current Avatar Display */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentImageUrl} alt={title} />
          <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-lg font-semibold">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {currentImageUrl ? 'Cambiar' : 'Subir'}
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Subir nueva imagen</p>
                  <p className="text-sm text-muted-foreground">
                    La imagen se recortará automáticamente a formato cuadrado
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpload(false)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleButtonClick}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar archivo
                    </>
                  )}
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <p className="text-xs text-muted-foreground text-center">
                  Formatos: JPG, PNG, GIF. Máximo {maxSizeMB}MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}