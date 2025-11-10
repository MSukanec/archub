import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { UploadGallery } from "@/components/ui-custom/media/UploadGallery";
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

  const handleExistingFileDelete = async (fileId: string) => {
    try {
      const fileToDelete = siteLogFiles.find(f => f.id === fileId);
      if (!fileToDelete) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([fileToDelete.file_path]);

      if (storageError) {
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
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo.",
        variant: "destructive"
      });
    }
  };

  return (
    <UploadGallery
      existingFiles={siteLogFiles}
      filesToUpload={filesToUpload}
      onFilesChange={setFilesToUpload}
      onExistingFileDelete={handleExistingFileDelete}
      title="Archivos y Media"
      emptyStateTitle="No hay archivos adjuntos"
      emptyStateDescription="Los archivos que subas aparecerán aquí organizados en una galería visual"
      uploadButtonText="Subir Archivos"
      newFileBadgeText="Nuevo"
      maxSize={50 * 1024 * 1024} // 50MB
      acceptedTypes={{
        'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
        'video/*': ['.mp4', '.mov', '.avi', '.mkv']
      }}
    />
  );
}