import React from "react";
import { Camera, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { SiteLogFileInput } from "@/utils/uploadSiteLogFiles";

interface MediaFormProps {
  filesToUpload: SiteLogFileInput[];
  setFilesToUpload: (files: SiteLogFileInput[]) => void;
  siteLogFiles: any[];
}

export function MediaForm({ 
  filesToUpload, 
  setFilesToUpload, 
  siteLogFiles 
}: MediaFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Funciones para manejar archivos
  const removeFileToUpload = (index: number) => {
    setFilesToUpload(filesToUpload.filter((_, i) => i !== index));
  };

  const removeExistingFile = async (fileId: string) => {
    try {
      const fileToDelete = siteLogFiles.find(f => f.id === fileId);
      if (!fileToDelete) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([fileToDelete.file_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_media')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw dbError;
      }

      queryClient.invalidateQueries({ queryKey: ['site-log-files'] });
      queryClient.invalidateQueries({ queryKey: ['galleryFiles'] });
      
      toast({
        title: "Archivo eliminado",
        description: "El archivo se ha eliminado correctamente."
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo.",
        variant: "destructive"
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      const newFiles: SiteLogFileInput[] = acceptedFiles.map(file => ({
        file,
        title: file.name,
        description: ''
      }));
      setFilesToUpload([...filesToUpload, ...newFiles]);
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  return (
    <div className="space-y-6">
      {/* Drag & Drop Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {isDragActive
                ? 'Suelta los archivos aquí'
                : 'Arrastra archivos aquí o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-muted-foreground">
              Imágenes (PNG, JPG, GIF) o Videos (MP4, MOV, AVI, MKV). Máximo 50MB por archivo.
            </p>
          </div>
        </div>
      </div>

      {/* Archivos seleccionados para subir */}
      {filesToUpload.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Archivos para subir ({filesToUpload.length})</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilesToUpload([])}
              className="text-muted-foreground hover:text-foreground"
            >
              Limpiar todo
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {filesToUpload.map((fileInput, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileInput.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(fileInput.file.size / (1024 * 1024)).toFixed(1)} MB • {fileInput.file.type}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeFileToUpload(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archivos existentes */}
      {siteLogFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Archivos existentes ({siteLogFiles.length})</h4>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {siteLogFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file_size / (1024 * 1024)).toFixed(1)} MB • {file.file_type}
                    {file.description && ` • ${file.description}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.file_url, '_blank')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Ver
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeExistingFile(file.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {filesToUpload.length === 0 && siteLogFiles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay archivos adjuntos</p>
          <p className="text-xs">Arrastra archivos arriba para comenzar</p>
        </div>
      )}
    </div>
  );
}