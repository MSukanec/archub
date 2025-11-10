import React, { useState } from 'react'
import { UploadGallery } from '@/components/ui-custom/media/UploadGallery'
import { 
  useContactAttachments, 
  useCreateContactAttachment, 
  useDeleteContactAttachment,
  useSetContactAvatar 
} from '@/hooks/useContactAttachments';
import { getAttachmentPublicUrl } from '@/services/contactAttachments';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';

interface ContactAttachmentsFormProps {
  contactId: string;
  contact: any;
}

export function ContactAttachmentsForm({ contactId, contact }: ContactAttachmentsFormProps) {
  const [filesToUpload, setFilesToUpload] = useState<any[]>([]);
  
  const { data: userData } = useCurrentUser();
  const { data: attachments = [], isLoading } = useContactAttachments(contactId);
  const createAttachment = useCreateContactAttachment();
  const deleteAttachment = useDeleteContactAttachment();
  const setAvatar = useSetContactAvatar();
  const { toast } = useToast();

  // Convert attachments to format expected by UploadGallery
  const existingFiles = attachments.map(attachment => ({
    ...attachment,
    file_url: getAttachmentPublicUrl(attachment),
    file_type: attachment.mime_type
  }));

  const handleFilesChange = async (newFiles: any[]) => {
    // Handle only truly new files (those that were just added)
    const existingCount = filesToUpload.length;
    const addedFiles = newFiles.slice(existingCount);
    
    if (addedFiles.length > 0) {
      // Upload new files immediately
      for (const fileInput of addedFiles) {
        try {
          await createAttachment.mutateAsync({
            contactId,
            file: fileInput.file,
            category: 'photo', // Always save as photo
            createdBy: userData?.user?.id || ''
          });
          
          toast({
            title: "Archivo subido",
            description: `${fileInput.file.name} se ha subido correctamente`,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: `No se pudo subir ${fileInput.file.name}`,
            variant: "destructive",
          });
        }
      }
    }
    
    setFilesToUpload(newFiles);
  };

  const handleExistingFileDelete = async (fileId: string) => {
    const attachment = attachments.find(a => a.id === fileId);
    if (!attachment) return;

    // If it's the current avatar, remove avatar reference first
    if (attachment.id === contact.avatar_attachment_id) {
      try {
        await setAvatar.mutateAsync({
          contactId,
          attachmentId: '' // Remove avatar
        });
      } catch (error) {
      }
    }

    await deleteAttachment.mutateAsync(fileId);
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
    <UploadGallery
      existingFiles={existingFiles}
      filesToUpload={filesToUpload}
      onFilesChange={handleFilesChange}
      onExistingFileDelete={handleExistingFileDelete}
      onDownload={handleDownload}
      onCopyLink={handleCopyLink}
      title="Archivos y Media"
      emptyStateTitle="No hay archivos adjuntos"
      emptyStateDescription="Los archivos que subas aparecerán aquí organizados en una galería visual"
      uploadButtonText="Subir Archivos"
      newFileBadgeText="Nuevo"
      maxSize={10 * 1024 * 1024} // 10MB para contactos
      acceptedTypes={{
        'image/*': ['.png', '.jpg', '.jpeg', '.gif']
      }}
    />
  )
}