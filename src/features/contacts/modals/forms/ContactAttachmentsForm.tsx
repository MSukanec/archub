import React, { useState } from 'react';
import { UploadMediaField } from '@/components/ui-custom/fields/UploadMediaField';
import { 
  useContactAttachments, 
  useCreateContactAttachment, 
  useDeleteContactAttachment,
  useSetContactAvatar 
} from '@/features/contacts/hooks';
import { getAttachmentPublicUrl } from '@/features/contacts/utils';
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

  const existingFiles = attachments.map(attachment => ({
    ...attachment,
    file_url: getAttachmentPublicUrl(attachment),
    file_type: attachment.mime_type
  }));

  const handleFilesChange = async (newFiles: any[]) => {
    const existingCount = filesToUpload.length;
    const addedFiles = newFiles.slice(existingCount);
    
    if (addedFiles.length > 0) {
      for (const fileInput of addedFiles) {
        try {
          await createAttachment.mutateAsync({
            contactId,
            file: fileInput.file,
            category: 'photo',
            createdBy: userData?.user?.id || ''
          });
          
          toast({
            title: "Archivo subido",
            description: `${fileInput.file.name} se ha subido correctamente`,
          });
        } catch (error) {
          console.error('Error al subir archivo:', error);
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

    if (attachment.id === contact.avatar_attachment_id) {
      try {
        await setAvatar.mutateAsync({
          contactId,
          attachmentId: ''
        });
      } catch (error) {
        console.error('Error removing avatar:', error);
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
    <UploadMediaField
      existingFiles={existingFiles}
      filesToUpload={filesToUpload}
      onFilesChange={handleFilesChange}
      onExistingFileDelete={handleExistingFileDelete}
      emptyStateTitle="No hay archivos adjuntos"
      emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
      uploadButtonText="Subir Archivos"
      newFileBadgeText="Nuevo"
      maxSize={10 * 1024 * 1024}
      acceptedTypes={{
        'image/*': ['.png', '.jpg', '.jpeg', '.gif']
      }}
    />
  );
}
