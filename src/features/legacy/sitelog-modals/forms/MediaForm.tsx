import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "@/components/shared/fields/FileUploader";
import { deleteMediaFileV2 } from "@/features/media/services/deleteMediaFileV2";
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
      if (!fileToDelete) {
        toast({
          title: "Error",
          description: "No se encontró el archivo a eliminar.",
          variant: "destructive"
        });
        return;
      }

      // Necesitamos el link_id para eliminar (no el file_id)
      const linkId = fileToDelete.link_id;
      if (!linkId) {
        toast({
          title: "Error",
          description: "No se puede eliminar este archivo (link_id faltante).",
          variant: "destructive"
        });
        return;
      }

      // Usar el servicio V2 que maneja la eliminación completa
      await deleteMediaFileV2(linkId);

      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['sitelog-files'] });
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-files'] });
      
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
    <FileUploader
      mode="multiple"
      existingFiles={siteLogFiles}
      filesToUpload={filesToUpload}
      onFilesChange={setFilesToUpload}
      onExistingFileDelete={handleExistingFileDelete}
      accept="media"
      compressOnDrop={true}
      compressionPreset="sitelog-photo"
      emptyStateTitle="No hay archivos adjuntos"
      emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
      newFileBadgeText="Nuevo"
      maxSize={50 * 1024 * 1024}
    />
  );
}