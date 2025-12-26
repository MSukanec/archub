import { useMemo, useState } from "react";
  Upload, 
  Trash2,
  FileText,
  Image as ImageIcon,
  Film,
  File,
  Camera,
  X,
  Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from 'react-dropzone';
import { useToast } from "@/hooks/use-toast";
import { ImageLightbox, useImageLightbox } from '@/components/shared/viewers/ImageLightbox';
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
type AcceptPreset = 'all'| 'images'| 'media'| 'documents';
const ACCEPT_PRESETS: Record<AcceptPreset, Record<string, string[]>> = {
  all: {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  },
  images: {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
  },
  media: {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.mov', '.avi', '.mkv']
  },
  documents: {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  }
};
export interface FileUploaderProps {
  mode?: 'single'| 'multiple';
  existingFiles?: any[];
  filesToUpload?: any[];
  onFilesChange: (files: any[]) => void;
  onExistingFileDelete?: (fileId: string) => Promise<void>;
  accept?: AcceptPreset | Record<string, string[]>;
  maxSize?: number;
  compressionPreset?: ImagePreset;
  compressOnDrop?: boolean;
  variant?: 'dropzone'| 'hero'| 'compact';
  showLightbox?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  newFileBadgeText?: string;
  maxSizeLabel?: string;
  className?: string;
  heroImageUrl?: string | null;
  onHeroImageChange?: (url: string | null) => void;
  isUploading?: boolean;
  disabled?: boolean;
}
export function FileUploader({
  mode = 'multiple',
  existingFiles = [],
  filesToUpload = [],
  onFilesChange,
  onExistingFileDelete,
  accept = 'all',
  maxSize = 2 * 1024 * 1024,
  compressionPreset = 'default',
  compressOnDrop = false,
  variant = 'dropzone',
  showLightbox = true,
  emptyStateTitle = "Sin archivos",
  emptyStateDescription = "Arrastra archivos o haz clic para seleccionar",
  newFileBadgeText = "Nuevo",
  maxSizeLabel,
  className,
  heroImageUrl,
  onHeroImageChange,
  isUploading = false,
  disabled = false
}: FileUploaderProps) {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [dragActive, setDragActive] = useState(false);
  const acceptedTypes = typeof accept === 'string'? ACCEPT_PRESETS[accept] : accept;
  const normalizedExistingFiles: FileItem[] = existingFiles.map(file => ({
    id: file.id,
    file_name: file.file_name || file.fileName || 'Archivo',
    file_type: file.file_type || file.mime_type?.split('/')[0] || 'document',
    file_size: file.file_size || file.size || 0,
    file_url: file.file_url || file.url,
    mime_type: file.mime_type || file.file_type,
    isExisting: true,
    ...file
  }));
  const normalizedFilesToUpload: FileItem[] = filesToUpload.map((fileInput, index) => ({
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
  const imageUrls = useMemo(() => {
    if (!showLightbox) return [];
    const existingImageUrls = normalizedExistingFiles
      .filter(file => file.file_type === 'image'|| file.mime_type?.startsWith('image/'))
      .map(file => file.file_url);
    const previewImageUrls = normalizedFilesToUpload
      .filter(file => file.file_type === 'image'|| file.mime_type?.startsWith('image/'))
      .map(file => file.file_url);
    return [...existingImageUrls, ...previewImageUrls];
  }, [normalizedExistingFiles, normalizedFilesToUpload, showLightbox]);
  const { 
    isOpen: isLightboxOpen, 
    currentIndex, 
    openLightbox, 
    closeLightbox
  } = useImageLightbox(imageUrls);
  const handleImageClick = (imageUrl: string) => {
    if (!showLightbox) return;
    const imageIndex = imageUrls.indexOf(imageUrl);
    if (imageIndex !== -1) {
      openLightbox(imageIndex);
    }
  };
  const removeFileToUpload = (index: number) => {
    if (mode === 'single') {
      onFilesChange([]);
    } else {
      onFilesChange(filesToUpload.filter((_, i) => i !== index));
    }
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
    if (mimeType?.startsWith('video/')) {
      return <Film className="w-4 h-4 text-muted-foreground" />;
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
    return Math.round(bytes / Math.pow(k, i)) + ''+ sizes[i];
  };
  const getAcceptedTypesLabel = (): string => {
    if (typeof accept === 'string') {
      switch (accept) {
        case 'images': return 'Imágenes';
        case 'media': return 'Imágenes, Videos';
        case 'documents': return 'PDF, Word, Excel';
        case 'all': return 'PDF, Imágenes, Word, Excel';
      }
    }
    return 'Archivos';
  };
  const processFiles = async (acceptedFiles: File[]) => {
    const processedFiles = [];
    
    for (const file of acceptedFiles) {
      let fileToUpload = file;
      
      if (compressOnDrop && shouldCompress(file)) {
        const originalSize = file.size;
        try {
          fileToUpload = await compressImage(file, compressionPreset);
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
    
    if (mode === 'single') {
      onFilesChange(processedFiles.slice(0, 1));
    } else {
      onFilesChange([...filesToUpload, ...processedFiles]);
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: processFiles,
    accept: acceptedTypes,
    maxSize,
    multiple: mode === 'multiple',
    noClick: false,
    disabled
  });
  const allFiles: FileItem[] = [
    ...normalizedExistingFiles,
    ...normalizedFilesToUpload
  ];
  const hasFile = allFiles.length > 0;
  const isFileUploading = (fileId: string) => uploadingFiles.has(fileId);
  if (variant === 'hero') {
    const displayUrl = heroImageUrl || (normalizedFilesToUpload[0]?.file_url);
    
    return (
      <div className={cn("w-full", className)}>
        <div 
          className={cn(
            "relative w-full h-64 md:h-80 rounded-lg overflow-hidden transition-colors",
            dragActive ? 'bg-primary/10': 'bg-muted/30'
          )}
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files.length > 0) {
              processFiles(Array.from(e.dataTransfer.files));
            }
          }}
        >
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt="Imagen"
                className="w-full h-full object-cover"
                key={displayUrl}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      document.getElementById('hero-uploader-input')?.click();
                    }}
                    disabled={isUploading || disabled}
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
                      if (onHeroImageChange) {
                        onHeroImageChange(null);
                      }
                      onFilesChange([]);
                    }}
                    disabled={isUploading || disabled}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div 
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-[var(--accent)] hover:border-[var(--accent)]/80 transition-colors rounded-lg hover:bg-muted/20"
              onClick={() => document.getElementById('hero-uploader-input')?.click()}
              role="button"
              tabIndex={0}
            >
              <div className="text-center space-y-4 p-8">
                <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center border border-muted-foreground/20">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {emptyStateDescription}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {maxSizeLabel || `Tamaño máximo: ${formatFileSize(maxSize)}`}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="text-sm font-medium">Subiendo imagen...</span>
              </div>
            </div>
          )}
        </div>
        <input
          id="hero-uploader-input"
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFiles(Array.from(e.target.files));
            }
          }}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }
  if (variant === 'compact'|| (mode === 'single'&& hasFile)) {
    const file = normalizedExistingFiles[0] || normalizedFilesToUpload[0];
    
    if (file) {
      return (
        <div className={cn("space-y-2", className)}>
          <div className="flex items-center gap-2 p-3 border border-border rounded-md bg-muted/30">
            <div className="flex-shrink-0 text-muted-foreground">
              {getFileIcon(file)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">
                  {file.file_name}
                </p>
                {!file.isExisting && (
                  <Badge variant="info" className="text-xs px-1.5 py-0">
                    {newFileBadgeText}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.file_size)}
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              {file.isExisting && file.file_url && (
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
                onClick={() => file.isExisting ? handleExistingFileDelete(file.id) : removeFileToUpload(0)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }
  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-accent bg-accent/5" : "border-accent/50 hover:border-accent",
          disabled && "opacity-50 cursor-not-allowed"
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
              {maxSizeLabel || `Tamaño máximo: ${formatFileSize(maxSize)} • ${getAcceptedTypesLabel()}`}
            </p>
          </div>
        </div>
      </div>
      {allFiles.length > 0 && (
        <div className="space-y-2">
          {allFiles.map((file) => {
            const isDeleting = isFileUploading(file.id);
            const isFileCurrentlyUploading = !file.isExisting && (file.uploadProgress || 0) < 100;
            const showProgress = isFileCurrentlyUploading && (file.uploadProgress || 0) > 0;
            const isImage = file.file_type === 'image'|| file.mime_type?.startsWith('image/');
            return (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
                  isDeleting && "opacity-50"
                )}
              >
                <div 
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center",
                    isImage && showLightbox ? "cursor-pointer" : ""
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {file.file_name}
                    </p>
                    {!file.isExisting && (
                      <Badge variant="info" className="text-xs shrink-0">
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 hover:text-destructive"
                  disabled={isDeleting || disabled}
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
      {showLightbox && (
        <ImageLightbox
          images={imageUrls}
          isOpen={isLightboxOpen}
          currentIndex={currentIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
export default FileUploader;
