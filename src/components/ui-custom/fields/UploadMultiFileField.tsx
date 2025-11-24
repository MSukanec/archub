import React, { useMemo, useState } from "react";
import { 
  Upload, 
  Trash2,
  FileText,
  Image as ImageIcon,
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from 'react-dropzone';
import { useToast } from "@/hooks/use-toast";
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/media/ImageLightbox';
import { cn } from "@/lib/utils";
import { compressImage, shouldCompress, formatCompressionStats, type ImagePreset } from '@/lib/imageCompression';

interface FileItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  isExisting: boolean;
  previewIndex?: number;
  mime_type?: string;
  uploadProgress?: number;
}

interface UploadMultiFileFieldProps {
  // Existing files
  existingFiles: any[];
  
  // New files to upload
  filesToUpload: any[];
  onFilesChange: (files: any[]) => void;
  
  // Upload configuration
  maxSize?: number; // in bytes, default 2MB
  acceptedTypes?: Record<string, string[]>;
  imageCompressionPreset?: ImagePreset;
  
  // Handlers
  onExistingFileDelete?: (fileId: string) => Promise<void>;
  
  // Display options
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  newFileBadgeText?: string;
}

export function UploadMultiFileField({
  existingFiles = [],
  filesToUpload = [],
  onFilesChange,
  maxSize = 2 * 1024 * 1024, // 2MB default
  acceptedTypes = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  },
  imageCompressionPreset = 'document',
  onExistingFileDelete,
  emptyStateTitle = "No hay archivos adjuntos",
  emptyStateDescription = "Arrastra archivos o haz clic para seleccionar",
  newFileBadgeText = "Nuevo"
}: UploadMultiFileFieldProps) {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // Normalize existing files to common format
  const normalizedExistingFiles = existingFiles.map(file => ({
    id: file.id,
    file_name: file.file_name || file.fileName || 'Archivo',
    file_type: file.file_type || file.mime_type?.split('/')[0] || 'document',
    file_size: file.file_size || file.size || 0,
    file_url: file.file_url || file.url,
    mime_type: file.mime_type || file.file_type,
    isExisting: true,
    ...file
  }));

  // Normalize files to upload to common format
  const normalizedFilesToUpload = filesToUpload.map((fileInput, index) => ({
    id: `preview-${index}`,
    file_name: fileInput.file?.name || fileInput.name || 'Archivo',
    file_type: fileInput.file?.type?.split('/')[0] || fileInput.type?.split('/')[0] || 'document',
    file_size: fileInput.file?.size || fileInput.size || 0,
    file_url: fileInput.file ? URL.createObjectURL(fileInput.file) : (fileInput.url || ''),
    mime_type: fileInput.file?.type || fileInput.type,
    isExisting: false,
    previewIndex: index,
    uploadProgress: fileInput.uploadProgress || 0,
    ...fileInput
  }));

  // Lightbox setup - for all images
  const imageUrls = useMemo(() => {
    const existingImageUrls = normalizedExistingFiles
      .filter(file => file.file_type === 'image' || file.mime_type?.startsWith('image/'))
      .map(file => file.file_url);
    
    const previewImageUrls = normalizedFilesToUpload
      .filter(file => file.file_type === 'image' || file.mime_type?.startsWith('image/'))
      .map(file => file.file_url);
    
    return [...existingImageUrls, ...previewImageUrls];
  }, [normalizedExistingFiles, normalizedFilesToUpload]);

  const { 
    isOpen: isLightboxOpen, 
    currentIndex, 
    openLightbox, 
    closeLightbox
  } = useImageLightbox(imageUrls);

  const handleImageClick = (imageUrl: string) => {
    const imageIndex = imageUrls.indexOf(imageUrl);
    if (imageIndex !== -1) {
      openLightbox(imageIndex);
    }
  };

  const removeFileToUpload = (index: number) => {
    onFilesChange(filesToUpload.filter((_, i) => i !== index));
  };

  const handleExistingFileDelete = async (fileId: string) => {
    if (onExistingFileDelete) {
      setUploadingFiles(prev => new Set(prev).add(fileId));
      try {
        await onExistingFileDelete(fileId);
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }
  };

  const getFileIcon = (file: FileItem) => {
    const mimeType = file.mime_type;
    if (mimeType?.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4 text-muted-foreground" />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles: File[]) => {
      const processedFiles = [];
      
      for (const file of acceptedFiles) {
        let fileToUpload = file;
        
        // Compress images only
        if (shouldCompress(file)) {
          const originalSize = file.size;
          
          try {
            fileToUpload = await compressImage(file, imageCompressionPreset);
            
            // Show compression stats if there was significant reduction
            if (originalSize !== fileToUpload.size) {
              toast({
                title: "Imagen optimizada",
                description: formatCompressionStats(originalSize, fileToUpload.size),
              });
            }
          } catch (compressionError) {
            console.error('Error compressing image:', compressionError);
            toast({
              title: "Advertencia",
              description: `No se pudo comprimir ${file.name}, subiendo original`,
              variant: "default"
            });
          }
        }
        
        // Validate file size AFTER compression
        if (fileToUpload.size > maxSize) {
          toast({
            title: "Archivo muy grande",
            description: `${file.name} excede el tamaño máximo de ${formatFileSize(maxSize)}`,
            variant: "destructive"
          });
          continue;
        }
        
        processedFiles.push({
          file: fileToUpload,
          title: fileToUpload.name,
          description: '',
          category: 'attachment',
          uploadProgress: 0
        });
      }
      
      onFilesChange([...filesToUpload, ...processedFiles]);
    },
    accept: acceptedTypes,
    maxSize,
    multiple: true,
    noClick: false
  });

  // Combine all files for display
  const allFiles: FileItem[] = [
    ...normalizedExistingFiles,
    ...normalizedFilesToUpload
  ];

  const isUploading = (fileId: string) => uploadingFiles.has(fileId);

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-accent bg-accent/5" : "border-accent/50 hover:border-accent"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-primary/10">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{emptyStateDescription}</p>
            <p className="text-xs text-muted-foreground">
              Tamaño máximo: {formatFileSize(maxSize)} • PDF, Imágenes, Word, Excel
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {allFiles.length > 0 && (
        <div className="space-y-2">
          {allFiles.map((file) => {
            const isDeleting = isUploading(file.id);
            const isFileUploading = !file.isExisting && (file.uploadProgress || 0) < 100;
            const showProgress = isFileUploading && (file.uploadProgress || 0) > 0;
            const isImage = file.file_type === 'image' || file.mime_type?.startsWith('image/');

            return (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
                  isDeleting && "opacity-50"
                )}
              >
                {/* Thumbnail */}
                <div 
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center",
                    isImage ? "cursor-pointer" : ""
                  )}
                  onClick={() => {
                    if (isImage) {
                      handleImageClick(file.file_url);
                    }
                  }}
                >
                  {isImage ? (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getFileIcon(file)
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {file.file_name}
                    </p>
                    {!file.isExisting && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {newFileBadgeText}
                      </Badge>
                    )}
                  </div>
                  
                  {showProgress ? (
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file_size * (file.uploadProgress || 0) / 100)} / {formatFileSize(file.file_size)}</span>
                        <span>•</span>
                        <span className="text-primary">{file.uploadProgress}%</span>
                      </div>
                      <Progress value={file.uploadProgress || 0} className="h-1" />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatFileSize(file.file_size)}
                      {file.isExisting && <span className="ml-2 text-green-600">• Completado</span>}
                    </p>
                  )}
                </div>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 hover:text-destructive"
                  disabled={isDeleting}
                  onClick={() => {
                    if (file.isExisting) {
                      handleExistingFileDelete(file.id);
                    } else {
                      removeFileToUpload(file.previewIndex!);
                    }
                  }}
                  data-testid={`delete-file-${file.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={imageUrls}
        isOpen={isLightboxOpen}
        currentIndex={currentIndex}
        onClose={closeLightbox}
      />
    </div>
  );
}
