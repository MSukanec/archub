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
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/media/ImageLightbox';
import { 
  useContactAttachments, 
  useCreateContactAttachment, 
  useDeleteContactAttachment,
  useSetContactAvatar 
} from '@/hooks/useContactAttachments';
import { getAttachmentPublicUrl, ContactAttachment } from '@/services/contactAttachments';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
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

export function ContactAttachmentsPanel({ contactId, contact, showUpload = true }: ContactAttachmentsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('photo');
  
  const { data: userData } = useCurrentUser();
  const { data: attachments = [], isLoading } = useContactAttachments(contactId);
  const createAttachment = useCreateContactAttachment();
  const deleteAttachment = useDeleteContactAttachment();
  const setAvatar = useSetContactAvatar();
  const { toast } = useToast();

  // Lightbox setup - for all images in attachments
  const imageUrls = useMemo(() => 
    attachments
      .filter(attachment => attachment.mime_type.startsWith('image/'))
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
    if (attachment.mime_type.startsWith('image/')) {
      const imageIndex = imageUrls.indexOf(getAttachmentPublicUrl(attachment));
      if (imageIndex !== -1) {
        openLightbox(imageIndex);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      for (const file of acceptedFiles) {
        try {
          await createAttachment.mutateAsync({
            contactId,
            file: file,
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
    maxSize: 10 * 1024 * 1024, // 10MB
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
    if (!attachment.mime_type.startsWith('image/')) {
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
    // Si es el avatar actual, pedir confirmación especial
    if (attachment.id === contact.avatar_attachment_id) {
      // La confirmación se maneja en el AlertDialog
      return;
    }

    await deleteAttachment.mutateAsync(attachment.id);
  };

  const handleDeleteWithAvatarCheck = async (attachment: ContactAttachment) => {
    // Si es el avatar, primero quitar el avatar y luego eliminar
    if (attachment.id === contact.avatar_attachment_id) {
      // Primero actualizar el contacto para quitar el avatar
      try {
        await setAvatar.mutateAsync({
          contactId,
          attachmentId: '' // o null según tu implementación
        });
      } catch (error) {
        console.error('Error removing avatar:', error);
      }
    }

    await deleteAttachment.mutateAsync(attachment.id);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
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
      {/* Header con título y botón alineados */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Archivos y Media</label>
        {showUpload && (
          <Popover>
          <PopoverTrigger asChild>
            <Button variant="default" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Subir Archivos
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Seleccionar categoría</h4>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Foto</SelectItem>
                    <SelectItem value="dni_front">DNI Frente</SelectItem>
                    <SelectItem value="dni_back">DNI Dorso</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div
                {...getRootProps()}
                className="cursor-pointer"
              >
                <input {...getInputProps()} />
                <Button className="w-full gap-2">
                  <Upload className="w-4 h-4" />
                  Seleccionar Archivos
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        )}
      </div>

      {/* Galería de archivos */}
      {attachments.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No hay archivos adjuntos"
          description="Los archivos que subas aparecerán aquí organizados en una galería visual"
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted/30 hover:bg-muted/50 transition-colors">
              {/* Contenido del archivo */}
              {attachment.mime_type.startsWith('image/') ? (
                <img
                  src={getAttachmentPublicUrl(attachment)}
                  alt={attachment.file_name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => handleImageClick(attachment)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  {getFileIcon(attachment.mime_type)}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                        className="w-full justify-start gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(attachment)}
                        className="w-full justify-start gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar enlace
                      </Button>

                      {attachment.mime_type.startsWith('image/') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetAsAvatar(attachment)}
                          disabled={attachment.id === contact.avatar_attachment_id}
                          className="w-full justify-start gap-2"
                        >
                          <UserRound className="w-4 h-4" />
                          Usar como avatar
                        </Button>
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
                            <AlertDialogTitle>Eliminar adjunto</AlertDialogTitle>
                            <AlertDialogDescription>
                              {attachment.id === contact.avatar_attachment_id 
                                ? 'Esto quitará el avatar del contacto y eliminará el archivo. ¿Continuar?'
                                : '¿Estás seguro de que quieres eliminar este archivo? Esta acción no se puede deshacer.'
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteWithAvatarCheck(attachment)}
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

              {/* Badges informativos */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs bg-background/80 ${categoryColors[attachment.category]}`}
                >
                  {categoryLabels[attachment.category]}
                </Badge>
                {attachment.id === contact.avatar_attachment_id && (
                  <Badge variant="default" className="text-xs bg-primary/90">
                    Avatar
                  </Badge>
                )}
              </div>


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