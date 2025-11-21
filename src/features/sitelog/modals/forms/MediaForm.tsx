import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { UploadMediaField } from "@/components/ui-custom/fields/UploadMediaField";
import type { SiteLogFileInput } from '../../types';

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

      // Invalidar todas las queries de archivos de sitelog (partial match)
      queryClient.invalidateQueries({ queryKey: ['sitelog-files'] });
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
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

  return (
    <UploadMediaField
      existingFiles={siteLogFiles}
      filesToUpload={filesToUpload}
      onFilesChange={setFilesToUpload}
      onExistingFileDelete={handleExistingFileDelete}
      emptyStateTitle="No hay archivos adjuntos"
      emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
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