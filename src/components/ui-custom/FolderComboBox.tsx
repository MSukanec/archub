import React from 'react';
import { FolderPlus } from 'lucide-react';
import { ComboBox } from './ComboBox';
import { useDesignDocumentFolders, useCreateDesignDocumentFolder } from '@/hooks/use-design-document-folders';
import { useToast } from '@/hooks/use-toast';

interface FolderComboBoxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function FolderComboBox({
  value,
  onValueChange,
  placeholder = "Seleccionar o crear carpeta...",
  className,
  disabled = false
}: FolderComboBoxProps) {
  const { data: folders = [], isLoading } = useDesignDocumentFolders();
  const createFolderMutation = useCreateDesignDocumentFolder();
  const { toast } = useToast();

  // Convert folders to ComboBox options
  const options = folders.map(folder => ({
    value: folder.id,
    label: folder.name
  }));

  const handleCreateFolder = async (folderName: string) => {
    try {
      const newFolder = await createFolderMutation.mutateAsync(folderName);
      toast({
        title: "Carpeta creada",
        description: `La carpeta "${newFolder.name}" ha sido creada exitosamente.`
      });
      return { value: newFolder.id, label: newFolder.name };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la carpeta",
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <ComboBox
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder="Buscar o crear carpeta..."
      emptyMessage="No se encontraron carpetas."
      className={className}
      disabled={disabled || isLoading}
      allowCreate={true}
      onCreateNew={handleCreateFolder}
      createLabel={(value) => `Crear "${value}"`}
    />
  );
}