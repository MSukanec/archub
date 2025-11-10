import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useDesignDocumentFolders } from '@/hooks/use-design-document-folders';

import { useCreateDesignDocumentFolder } from '@/hooks/use-design-document-folders';
import { useCreateDesignDocument, useDesignDocuments } from '@/hooks/use-design-documents';
import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, File, FileText, FolderOpen, Plus } from 'lucide-react';

import { supabase } from '@/lib/supabase';

const documentUploadSchema = z.object({
  folder_id: z.string(),
  status: z.string().min(1, 'El estado es obligatorio'),
  new_folder_name: z.string().optional(),
  parent_folder_id: z.string().optional(),
}).refine((data) => {
  // If not creating new folder, folder_id must be provided
  // If creating new folder, new_folder_name must be provided
  const isCreatingNew = !data.folder_id || data.folder_id === '';
  
  if (isCreatingNew) {
    return data.new_folder_name && data.new_folder_name.trim().length > 0;
  } else {
    return data.folder_id.length > 0;
  }
}, {
  message: 'Debe seleccionar una carpeta existente o crear una nueva',
  path: ['folder_id']
});

type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

interface DocumentUploadFormModalProps {
  modalData?: {
    defaultFolderId?: string;
  };
  onClose: () => void;
}

export function DocumentUploadFormModal({ modalData, onClose }: DocumentUploadFormModalProps) {
  const { defaultFolderId } = modalData || {};
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPanel } = useModalPanelStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<{ [key: number]: string }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: organizationMembers } = useOrganizationMembers(userData?.preferences?.last_organization_id || '');
  const { data: folders = [] } = useDesignDocumentFolders();
  const { data: existingDocuments = [] } = useDesignDocuments();
  const createFolderMutation = useCreateDesignDocumentFolder();
  const createDocumentMutation = useCreateDesignDocument();

  // Initialize panel to edit mode when modal opens
  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  const form = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      folder_id: defaultFolderId || '',
      status: 'pendiente',
      new_folder_name: '',
      parent_folder_id: '',
    },
  });

  // Update selectedFolderId when form folder_id changes
  useEffect(() => {
    const folderId = form.watch('folder_id');
    setSelectedFolderId(folderId);
  }, [form.watch('folder_id'), selectedFolderId, form]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (userData) {
      form.reset({
        folder_id: defaultFolderId || '',
        status: 'pendiente',
        new_folder_name: '',
        parent_folder_id: '',
      });
      setSelectedFiles([]);
      setFileNames({});
      setUploadProgress(0);
      setShowNewFolderInput(false);
    }
  }, [userData, organizationMembers, defaultFolderId, form]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    
    // Initialize file names with filename without extension as default
    const newFileNames: { [key: number]: string } = {};
    files.forEach((file, index) => {
      newFileNames[index] = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    });
    setFileNames(newFileNames);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFileNames(prev => {
      const newFileNames = { ...prev };
      delete newFileNames[index];
      // Reindex remaining files
      const reindexed: { [key: number]: string } = {};
      Object.entries(newFileNames).forEach(([key, value], newIndex) => {
        if (parseInt(key) > index) {
          reindexed[newIndex] = value;
        } else if (parseInt(key) < index) {
          reindexed[parseInt(key)] = value;
        }
      });
      return reindexed;
    });
  };

  const updateFileName = (index: number, name: string) => {
    setFileNames(prev => ({
      ...prev,
      [index]: name,
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadMutation = useMutation({
    mutationFn: async (data: DocumentUploadFormData) => {
      if (!userData?.preferences?.last_project_id || !userData?.preferences?.last_organization_id) {
        throw new Error('No hay proyecto u organización seleccionada');
      }

      if (selectedFiles.length === 0) {
        throw new Error('Debe seleccionar al menos un archivo');
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Upload documents directly to folder without groups

      // Process each file
      const uploads = selectedFiles.map(async (file, index) => {
        const fileName = fileNames[index] || file.name.replace(/\.[^/.]+$/, '');
        
        // Generate file path: organization_id/project_id/documents/folder_id/filename
        const extension = file.name.split('.').pop() || '';
        const filePath = `${userData.preferences?.last_organization_id}/${userData.preferences?.last_project_id}/documents/${data.folder_id}/${Date.now()}-${file.name}`;
        
        // First upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('design-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Error subiendo archivo ${file.name}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('design-documents')
          .getPublicUrl(filePath);

        // Create document record in database
        return createDocumentMutation.mutateAsync({
          name: fileName,
          file_name: file.name,
          description: '',
          file_path: filePath,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          folder_id: data.folder_id,
          status: data.status,
        });
      });

      return Promise.all(uploads);
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: `${selectedFiles.length > 1 ? 'Documentos subidos' : 'Documento subido'} correctamente`,
      });
      // Invalidate all document-related queries
      queryClient.invalidateQueries({ queryKey: ['design-documents'] });
      queryClient.invalidateQueries({ queryKey: ['design-documents-folder'] });
      queryClient.invalidateQueries({ queryKey: ['design-document-folders'] });

      

      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al subir documentos',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUploading(false);
      setUploadProgress(0);
    },
  });



  const handleClose = () => {
    form.reset();
    setSelectedFiles([]);
    setFileNames({});
    setUploadProgress(0);
    setShowNewFolderInput(false);
    onClose();
  };

  const onSubmit = async (data: DocumentUploadFormData) => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos un archivo',
        variant: 'destructive',
      });
      return;
    }

    // If creating a new folder, create it first
    let finalFolderId = data.folder_id;
    
    if (showNewFolderInput && data.new_folder_name?.trim()) {
      try {
        const newFolder = await createFolderMutation.mutateAsync({
          name: data.new_folder_name.trim(),
          parent_id: data.parent_folder_id || undefined,
        });
        finalFolderId = newFolder.id;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al crear la carpeta',
          variant: 'destructive',
        });
        return;
      }
    }

    // Upload documents with the final folder ID
    uploadMutation.mutate({ ...data, folder_id: finalFolderId });
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 1. Folder and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="folder_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carpeta <span className="text-[var(--accent)]">*</span></FormLabel>
                <Select 
                  onValueChange={(value) => {
                    if (value === '__create_new__') {
                      setShowNewFolderInput(true);
                      field.onChange(''); // Clear the folder_id since we'll create a new one
                    } else {
                      setShowNewFolderInput(false);
                      field.onChange(value);
                    }
                  }} 
                  value={showNewFolderInput ? '__create_new__' : field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar o crear carpeta..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__create_new__">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Crear nueva carpeta...
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_revision">En Revisión</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* New Folder Creation Fields */}
        {showNewFolderInput && (
          <div className="space-y-4 p-4 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)]">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Plus className="h-4 w-4" />
              Crear Nueva Carpeta
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="new_folder_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la carpeta <span className="text-[var(--accent)]">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Planos Estructurales" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parent_folder_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carpeta padre (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Carpeta raíz (sin padre)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Carpeta raíz (sin padre)</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* 4. Description Field */}


        {/* 5. File Upload Section */}
        <div className="space-y-4">
          <div>
            <FormLabel>Archivos <span className="text-[var(--accent)]">*</span></FormLabel>
            <div 
              onClick={triggerFileInput}
              className="relative border-2 border-dashed border-[var(--accent)] rounded-lg p-6 text-center hover:border-[var(--accent)] transition-colors cursor-pointer mt-2"
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Haz clic aquí para seleccionar archivos
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos soportados: PDF, DOC, XLS, PPT, imágenes, CAD, 3D, comprimidos
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.cad,.dwg,.zip,.rar,.7z"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <FormLabel>
                Archivos seleccionados ({selectedFiles.length})
              </FormLabel>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-[var(--card-border)] rounded-md bg-[var(--card-bg)]"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <Input
                          value={fileNames[index] || ''}
                          onChange={(e) => updateFileName(index, e.target.value)}
                          placeholder="Nombre del documento"
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Archivo original: {file.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className=""
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader
      title="Nueva Entrega de Documentos"
      icon={FolderOpen}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isUploading ? "Subiendo..." : "Nueva Entrega de Documentos"}
      onRightClick={form.handleSubmit(onSubmit)}
      submitDisabled={selectedFiles.length === 0 || isUploading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}