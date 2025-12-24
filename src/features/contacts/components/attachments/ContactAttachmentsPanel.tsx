import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, 
  Trash2, 
  UserRound, 
  FileText, 
  Image as ImageIcon,
  Copy,
  Upload,
  MoreHorizontal
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { EmptyState } from '@/components/shared/EmptyState';
import { ImageLightbox, useImageLightbox } from '@/components/shared/viewers/ImageLightbox';
import { 
  useContactAttachments, 
  useCreateContactAttachment, 
  useDeleteContactAttachment,
  useSetContactAvatar 
} from '@/features/contacts/hooks';
import { getAttachmentPublicUrl } from '@/features/contacts/utils';
import type { ContactAttachment } from '@/features/contacts/types';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { compressImage, shouldCompress, formatCompressionStats, type ImagePreset } from '@/lib/imageCompression';
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

interface ContactAttachmentsPanelProps {
  contactId: string;
  organizationId: string;
  contact: {
    avatar_attachment_id?: string;
  };
  showUpload?: boolean;
}

const categoryLabels = {
  dni_front: 'DNI Frente',
  dni_back: 'DNI Dorso',
  document: 'Documento',
  photo: 'Foto',
  other: 'Otro'
};

const categoryColors = {
  dni_front: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  dni_back: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  document: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  photo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  other: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
};

export function ContactAttachmentsPanel({ contactId, organizationId, contact, showUpload = true }: ContactAttachmentsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('photo');
  
  const { data: userData } = useCurrentUser();
  const { data: attachments = [], isLoading } = useContactAttachments(contactId);
  const createAttachment = useCreateContactAttachment(contactId, organizationId);
  const deleteAttachment = useDeleteContactAttachment(contactId, organizationId);
  const setAvatar = useSetContactAvatar(organizationId);
  const { toast } = useToast();

  const imageUrls = useMemo(() => 
    attachments
      .filter(attachment => attachment.mime_type?.startsWith('image/'))
      .map(attachment => getAttachmentPublicUrl(attachment)), 
    [attachments]
  );
  
  const { 
    isOpen: isLightboxOpen, 
    currentIndex, 
    openLightbox, 
    closeLightbox
  } = useImageLightbox(imageUrls);

  const handleImageClick = (attachment: ContactAttachment) => {
    if (attachment.mime_type?.startsWith('image/')) {
      const imageIndex = imageUrls.indexOf(getAttachmentPublicUrl(attachment));
      if (imageIndex !== -1) {
        openLightbox(imageIndex);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          let fileToUpload: File = file;
          
          // Compress images based on category
          if (shouldCompress(file)) {
            const originalSize = file.size;
            
            // Determine preset based on category
            let preset: ImagePreset = 'default';
            if (selectedCategory === 'photo') {
              preset = 'avatar';
            } else if (selectedCategory === 'document') {
              preset = 'document';
            }
            
            try {
              const compressedFile = await compressImage(file, preset);
              fileToUpload = compressedFile as File;
              
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
                description: "No se pudo comprimir la imagen, subiendo original",
                variant: "default"
              });
            }
          }
          
          // Validate file size AFTER compression (max 10MB)
          if (fileToUpload.size > 10 * 1024 * 1024) {
            toast({
              title: "Error",
              description: "El archivo no puede superar los 10MB",
              variant: "destructive"
            });
            continue;
          }
          
          await createAttachment.mutateAsync({
            file: fileToUpload,
            category: selectedCategory as 'photo' | 'dni_front' | 'dni_back' | 'document' | 'other',
            createdBy: userData?.user?.id || ''
          });
          
          toast({
            title: "Archivo subido",
            description: `${file.name} se ha subido correctamente`,
          });
        } catch (error) {
          console.error('Error al subir archivo:', error);
          toast({
            title: "Error",
            description: `No se pudo subir ${file.name}`,
            variant: "destructive",
          });
        }
      }
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true
  });

  const handleDownload = (attachment: ContactAttachment) => {
    const url = getAttachmentPublicUrl(attachment);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = async (attachment: ContactAttachment) => {
    const url = getAttachmentPublicUrl(attachment);
    await navigator.clipboard.writeText(url);
    toast({
      title: "Enlace copiado",
      description: "El enlace del archivo ha sido copiado al portapapeles",
    });
  };

  const handleSetAsAvatar = async (attachment: ContactAttachment) => {
    if (!attachment.mime_type?.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo las imágenes pueden usarse como avatar",
        variant: "destructive"
      });
      return;
    }

    await setAvatar.mutateAsync({
      contactId,
      attachmentId: attachment.id
    });
  };

  const handleDelete = async (attachment: ContactAttachment) => {
    if (attachment.id === contact.avatar_attachment_id) {
      await setAvatar.mutateAsync({
        contactId,
        attachmentId: ''
      });
    }

    await deleteAttachment.mutateAsync(attachment.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showUpload && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {isDragActive 
                ? 'Suelta los archivos aquí...' 
                : 'Arrastra archivos aquí o haz clic para seleccionar'
              }
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Máximo 10MB por archivo
            </p>
          </div>
        </div>
      )}

      {attachments.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No hay archivos adjuntos"
          description="Sube archivos usando el área de arriba"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachments.map((attachment) => {
            const isImage = attachment.mime_type?.startsWith('image/');
            const isAvatar = attachment.id === contact.avatar_attachment_id;
            const url = getAttachmentPublicUrl(attachment);

            return (
              <div
                key={attachment.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {isImage ? (
                  <div
                    className="relative aspect-video bg-muted cursor-pointer"
                    onClick={() => handleImageClick(attachment)}
                  >
                    <img
                      src={url}
                      alt={attachment.file_name}
                      className="w-full h-full object-cover"
                    />
                    {isAvatar && (
                      <Badge className="absolute top-2 left-2 bg-green-600">
                        Avatar
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-medium text-sm truncate">
                      {attachment.file_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="neutral"
                        className={categoryColors[attachment.category]}
                      >
                        {categoryLabels[attachment.category]}
                      </Badge>
                      {attachment.size_bytes && (
                        <span className="text-xs text-muted-foreground">
                          {(attachment.size_bytes / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Descargar
                    </Button>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="end">
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleCopyLink(attachment)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar enlace
                          </Button>
                          
                          {isImage && !isAvatar && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => handleSetAsAvatar(attachment)}
                            >
                              <UserRound className="h-4 w-4 mr-2" />
                              Usar como avatar
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El archivo se eliminará permanentemente.
                                  {isAvatar && (
                                    <span className="block mt-2 text-amber-600 dark:text-amber-400">
                                      Este archivo está siendo usado como avatar del contacto.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(attachment)}
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImageLightbox
        images={imageUrls}
        currentIndex={currentIndex}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
      />
    </div>
  );
}
