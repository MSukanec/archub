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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/ImageLightbox';
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

  // Lightbox setup - for all images in siteLogFiles and filesToUpload previews
  const imageUrls = useMemo(() => {
    const existingImageUrls = siteLogFiles
      .filter(file => file.file_type === 'image')
      .map(file => file.file_url);
    
    const previewImageUrls = filesToUpload
      .filter(fileInput => fileInput.file.type.startsWith('image/'))
      .map(fileInput => URL.createObjectURL(fileInput.file));
    
    return [...existingImageUrls, ...previewImageUrls];
  }, [siteLogFiles, filesToUpload]);

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

  const handleDownload = (file: any) => {
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = async (file: any) => {
    await navigator.clipboard.writeText(file.file_url);
    toast({
      title: "Enlace copiado",
      description: "El enlace del archivo ha sido copiado al portapapeles",
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
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

  // Combinar archivos existentes y archivos por subir para la galería
  const allFiles = [
    ...siteLogFiles.map(file => ({ ...file, isExisting: true })),
    ...filesToUpload.map((fileInput, index) => ({
      id: `preview-${index}`,
      file_name: fileInput.file.name,
      file_type: fileInput.file.type.split('/')[0],
      file_size: fileInput.file.size,
      file_url: URL.createObjectURL(fileInput.file),
      isExisting: false,
      previewIndex: index
    }))
  ];

  return (
    <div className="space-y-6">
      {/* Header con título y botón */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Archivos y Media
        </label>
        <div {...getRootProps()} className="cursor-pointer">
          <input {...getInputProps()} />
          <Button variant="default" size="sm" className="gap-2">
            <Upload className="w-4 h-4" />
            Subir Archivos
          </Button>
        </div>
      </div>

      {/* Galería de archivos */}
      {allFiles.length === 0 ? (
        <EmptyState
          icon={<Camera />}
          title="No hay archivos adjuntos"
          description="Los archivos que subas aparecerán aquí organizados en una galería visual"
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {allFiles.map((file) => (
            <div key={file.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted/30 hover:bg-muted/50 transition-colors">
              {/* Contenido del archivo */}
              {file.file_type === 'image' || file.file_type.startsWith('image/') ? (
                <img
                  src={file.file_url}
                  alt={file.file_name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => handleImageClick(file.file_url)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  {getFileIcon(file.file_type)}
                </div>
              )}

              {/* Overlay con botón de opciones - solo en la esquina superior derecha */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="default"
                      title="Opciones"
                      className="bg-black/60 hover:bg-black/80"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="space-y-1">
                      {file.isExisting && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(file)}
                            className="w-full justify-start gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Descargar
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(file)}
                            className="w-full justify-start gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar enlace
                          </Button>
                        </>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar archivo</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que quieres eliminar este archivo? Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (file.isExisting) {
                                  removeExistingFile(file.id);
                                } else {
                                  removeFileToUpload(file.previewIndex);
                                }
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Badge para archivos nuevos */}
              {!file.isExisting && (
                <div className="absolute top-2 left-2">
                  <Badge variant="default" className="text-xs bg-primary/90">
                    Nuevo
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