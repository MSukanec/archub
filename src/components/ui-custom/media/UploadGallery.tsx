import React, { useMemo } from "react";
import { 
  Camera, 
  Upload, 
  Download, 
  Trash2, 
  Copy,
  MoreHorizontal,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDropzone } from 'react-dropzone';
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/media/ImageLightbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FileItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  isExisting: boolean;
  previewIndex?: number;
  mime_type?: string;
}

interface UploadGalleryProps {
  // Existing files
  existingFiles: any[];
  
  // New files to upload
  filesToUpload: any[];
  onFilesChange: (files: any[]) => void;
  
  // Upload configuration
  maxSize?: number; // in bytes, default 50MB
  acceptedTypes?: Record<string, string[]>;
  
  // Handlers
  onExistingFileDelete?: (fileId: string) => Promise<void>;
  onDownload?: (file: any) => void;
  onCopyLink?: (file: any) => Promise<void>;
  
  // Display options
  title?: string;
  showTitle?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  newFileBadgeText?: string;
  
  // Upload button text
  uploadButtonText?: string;
}

export function UploadGallery({
  existingFiles = [],
  filesToUpload = [],
  onFilesChange,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'video/*': ['.mp4', '.mov', '.avi', '.mkv']
  },
  onExistingFileDelete,
  onDownload,
  onCopyLink,
  title = "Archivos y Media",
  showTitle = true,
  emptyStateTitle = "No hay archivos adjuntos",
  emptyStateDescription = "Los archivos que subas aparecerán aquí organizados en una galería visual",
  newFileBadgeText = "Nuevo",
  uploadButtonText = "Subir Archivos"
}: UploadGalleryProps) {
  const { toast } = useToast();

  // Normalize existing files to common format
  const normalizedExistingFiles = existingFiles.map(file => ({
    id: file.id,
    file_name: file.file_name || file.fileName,
    file_type: file.file_type || file.mime_type?.split('/')[0] || 'document',
    file_size: file.file_size || file.size || 0,
    file_url: file.file_url || file.url,
    mime_type: file.mime_type || file.file_type,
    isExisting: true,
    ...file // preserve original properties
  }));

  // Normalize files to upload to common format
  const normalizedFilesToUpload = filesToUpload.map((fileInput, index) => ({
    id: `preview-${index}`,
    file_name: fileInput.file?.name || fileInput.name,
    file_type: fileInput.file?.type?.split('/')[0] || fileInput.type?.split('/')[0] || 'document',
    file_size: fileInput.file?.size || fileInput.size || 0,
    file_url: fileInput.file ? URL.createObjectURL(fileInput.file) : (fileInput.url || ''),
    mime_type: fileInput.file?.type || fileInput.type,
    isExisting: false,
    previewIndex: index,
    ...fileInput // preserve original properties
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
      await onExistingFileDelete(fileId);
    }
  };

  const handleDownload = (file: FileItem) => {
    if (onDownload) {
      onDownload(file);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyLink = async (file: FileItem) => {
    if (onCopyLink) {
      await onCopyLink(file);
    } else {
      // Default copy behavior
      await navigator.clipboard.writeText(file.file_url);
      toast({
        title: "Enlace copiado",
        description: "El enlace del archivo ha sido copiado al portapapeles",
      });
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        title: file.name,
        description: '',
        category: 'photo' // Always save as photo
      }));
      onFilesChange([...filesToUpload, ...newFiles]);
    },
    accept: acceptedTypes,
    maxSize,
    multiple: true
  });

  // Combine all files for display
  const allFiles: FileItem[] = [
    ...normalizedExistingFiles,
    ...normalizedFilesToUpload
  ];

  return (
    <div className="space-y-4">
      {/* Upload button - full width */}
      <div {...getRootProps()} className="cursor-pointer">
        <input {...getInputProps()} />
        <Button variant="default" size="sm" className="w-full gap-2">
          <Upload className="w-4 h-4" />
          {uploadButtonText}
        </Button>
      </div>

      {/* Gallery */}
      {allFiles.length === 0 ? (
        <EmptyState
          icon={<Camera />}
          title={emptyStateTitle}
          description={emptyStateDescription}
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {allFiles.map((file) => (
            <div key={file.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted/30 hover:bg-muted/50 transition-colors">
              {/* File content */}
              {file.file_type === 'image' || file.mime_type?.startsWith('image/') ? (
                <img
                  src={file.file_url}
                  alt={file.file_name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => handleImageClick(file.file_url)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  {getFileIcon(file.mime_type)}
                </div>
              )}

              {/* Delete button overlay - top right corner */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  title="Eliminar archivo"
                  className="bg-black/60 hover:bg-red-600/80 text-white"
                  onClick={() => {
                    if (file.isExisting) {
                      handleExistingFileDelete(file.id);
                    } else {
                      removeFileToUpload(file.previewIndex!);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* Badge for new files */}
              {!file.isExisting && (
                <div className="absolute top-2 left-2">
                  <Badge variant="default" className="text-xs bg-primary/90">
                    {newFileBadgeText}
                  </Badge>
                </div>
              )}
            </div>
          ))}
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