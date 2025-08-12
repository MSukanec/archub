import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Trash2, 
  UserRound, 
  FileText, 
  Image as ImageIcon,
  Upload,
  Copy,
  Filter
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export function ContactAttachmentsPanel({ contactId, contact }: ContactAttachmentsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('photo');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const { data: userData } = useCurrentUser();
  const { data: attachments = [], isLoading } = useContactAttachments(contactId);
  const createAttachment = useCreateContactAttachment();
  const deleteAttachment = useDeleteContactAttachment();
  const setAvatar = useSetContactAvatar();
  const { toast } = useToast();

  const filteredAttachments = filterCategory === 'all' 
    ? attachments 
    : attachments.filter(att => att.category === filterCategory);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach(file => handleFileUpload(file));
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleFileUpload = async (file: File) => {
    if (!userData?.user?.id) return;

    try {
      await createAttachment.mutateAsync({
        contactId,
        file,
        category: selectedCategory as any,
        createdBy: userData.user.id
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

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
      {/* Área de dropzone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-accent bg-accent/5' 
                : 'border-muted-foreground/25 hover:border-accent'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              {isDragActive 
                ? 'Suelta los archivos aquí...' 
                : 'Arrastra archivos aquí o haz clic para seleccionar'
              }
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Máximo 10MB por archivo
            </p>
            
            {/* Selector de categoría */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">Categoría:</span>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-auto h-8">
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
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filtrar por:</span>
        <div className="flex gap-1">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
          >
            Todos
          </Button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={filterCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de adjuntos */}
      {filteredAttachments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No hay adjuntos en esta categoría</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAttachments.map((attachment) => (
            <Card key={attachment.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(attachment.mime_type)}
                    <span className="text-sm font-medium truncate">
                      {attachment.file_name}
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={categoryColors[attachment.category]}
                  >
                    {categoryLabels[attachment.category]}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Miniatura si es imagen */}
                {attachment.mime_type.startsWith('image/') && (
                  <div className="mb-3">
                    <img
                      src={getAttachmentPublicUrl(attachment)}
                      alt={attachment.file_name}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}

                {/* Información del archivo */}
                <div className="text-xs text-muted-foreground mb-3">
                  <p>Tamaño: {(attachment.size_bytes / 1024).toFixed(1)} KB</p>
                  <p>Subido: {new Date(attachment.created_at).toLocaleDateString()}</p>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyLink(attachment)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>

                  {attachment.mime_type.startsWith('image/') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetAsAvatar(attachment)}
                      disabled={attachment.id === contact.avatar_attachment_id}
                    >
                      <UserRound className="w-3 h-3" />
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-3 h-3" />
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

                {/* Indicador de avatar actual */}
                {attachment.id === contact.avatar_attachment_id && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="default" className="text-xs">
                      Avatar actual
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}