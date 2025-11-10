import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Upload, UserRound } from 'lucide-react';
import { useCreateContactAttachment, useSetContactAvatar, useContactAttachments } from '@/hooks/useContactAttachments';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getAttachmentPublicUrl } from '@/services/contactAttachments';
import { useToast } from '@/hooks/use-toast';

interface ContactAvatarUploaderProps {
  contactId: string;
  contact: {
    first_name?: string;
    last_name?: string;
    avatar_attachment_id?: string;
  };
}

export function ContactAvatarUploader({ contactId, contact }: ContactAvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { data: userData } = useCurrentUser();
  const { data: attachments } = useContactAttachments(contactId);
  const createAttachment = useCreateContactAttachment();
  const setAvatar = useSetContactAvatar();
  const { toast } = useToast();

  // Encontrar el attachment del avatar actual
  const currentAvatarAttachment = attachments?.find(
    att => att.id === contact.avatar_attachment_id
  );

  const avatarUrl = currentAvatarAttachment 
    ? getAttachmentPublicUrl(currentAvatarAttachment)
    : null;

  const initials = contact.first_name?.charAt(0) || 'C';

  const handleFileSelect = async (file: File) => {
    if (!file || !userData?.user?.id) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive"
      });
      return;
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 10MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Crear attachment con categoría 'photo'
      const attachment = await createAttachment.mutateAsync({
        contactId,
        file,
        category: 'photo',
        createdBy: userData.user.id
      });

      // Establecer como avatar
      await setAvatar.mutateAsync({
        contactId,
        attachmentId: attachment.id
      });

      setShowUpload(false);
    } catch (error) {
      console.error('Error al subir avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Limpiar input
    event.target.value = '';
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setShowUpload(true)}
      onMouseLeave={() => setShowUpload(false)}
    >
      {/* Avatar */}
      <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt="Avatar" />
        ) : null}
        <AvatarFallback className="text-2xl font-semibold bg-accent text-accent-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Overlay en hover */}
      {showUpload && !isUploading && (
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUploadClick}
              className=""
            >
              <Upload className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCameraClick}
              className=""
            >
              <Camera className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Indicador de carga */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Inputs ocultos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Texto de cambiar foto */}
      {showUpload && !isUploading && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <span className="text-xs text-muted-foreground whitespace-nowrap bg-background px-2 py-1 rounded border shadow-sm">
            Cambiar foto
          </span>
        </div>
      )}
    </div>
  );
}