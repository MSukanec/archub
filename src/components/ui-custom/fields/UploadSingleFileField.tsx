import React from "react";
import { 
  Upload, 
  Trash2, 
  X,
  FileText,
  Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDropzone } from 'react-dropzone';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  isExisting: boolean;
}

interface UploadSingleFileFieldProps {
  existingFiles: any[];
  filesToUpload: any[];
  onFilesChange: (files: any[]) => void;
  maxSize?: number;
  acceptedTypes?: Record<string, string[]>;
  onExistingFileDelete?: (fileId: string) => Promise<void>;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  newFileBadgeText?: string;
}

export function UploadSingleFileField({
  existingFiles = [],
  filesToUpload = [],
  onFilesChange,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  },
  onExistingFileDelete,
  emptyStateTitle = "Sin archivo adjunto",
  emptyStateDescription = "Arrastra un archivo o haz clic para seleccionar",
  newFileBadgeText = "Nuevo"
}: UploadSingleFileFieldProps) {
  const { toast } = useToast();

  // Normalize existing files
  const normalizedExistingFiles = existingFiles.map(file => ({
    id: file.id,
    file_name: file.file_name || file.fileName,
    file_type: file.file_type || file.mime_type?.split('/')[0] || 'document',
    file_size: file.file_size || file.size || 0,
    file_url: file.file_url || file.url,
    isExisting: true,
    ...file
  }));

  // Normalize files to upload
  const normalizedFilesToUpload = filesToUpload.map((fileInput, index) => ({
    id: `preview-${index}`,
    file_name: fileInput.file?.name || fileInput.name,
    file_type: fileInput.file?.type?.split('/')[0] || fileInput.type?.split('/')[0] || 'document',
    file_size: fileInput.file?.size || fileInput.size || 0,
    file_url: fileInput.file ? URL.createObjectURL(fileInput.file) : (fileInput.url || ''),
    isExisting: false,
    ...fileInput
  }));

  const hasFile = normalizedExistingFiles.length > 0 || normalizedFilesToUpload.length > 0;

  const removeFileToUpload = () => {
    onFilesChange([]);
  };

  const removeExistingFile = async (fileId: string) => {
    if (onExistingFileDelete) {
      try {
        await onExistingFileDelete(fileId);
        toast({
          title: 'Archivo eliminado',
          description: 'El archivo se eliminó correctamente',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el archivo',
          variant: 'destructive',
        });
      }
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    if (file.size > maxSize) {
      toast({
        title: 'Archivo muy grande',
        description: `El tamaño máximo es ${(maxSize / (1024 * 1024)).toFixed(0)}MB`,
        variant: 'destructive',
      });
      return;
    }

    onFilesChange([{ file, id: `new-${Date.now()}` }]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize,
    multiple: false,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = () => {
    return <FileText className="h-4 w-4" />;
  };

  // Si ya hay un archivo, solo mostrar el archivo sin el dropzone
  if (hasFile) {
    const file = normalizedExistingFiles[0] || normalizedFilesToUpload[0];
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 border border-border rounded-md bg-muted/30">
          <div className="flex-shrink-0 text-muted-foreground">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                {file.file_name}
              </p>
              {!file.isExisting && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {newFileBadgeText}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.file_size)}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            {file.isExisting && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => window.open(file.file_url, '_blank')}
                className="h-8 w-8 p-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => file.isExisting ? removeExistingFile(file.id) : removeFileToUpload()}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay archivo, mostrar el dropzone
  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
        isDragActive 
          ? "border-accent bg-accent/5" 
          : "border-border hover:border-accent/50 hover:bg-accent/5"
      )}
    >
      <input {...getInputProps()} />
      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground mb-1">
        {emptyStateTitle}
      </p>
      <p className="text-xs text-muted-foreground">
        {emptyStateDescription}
      </p>
    </div>
  );
}
