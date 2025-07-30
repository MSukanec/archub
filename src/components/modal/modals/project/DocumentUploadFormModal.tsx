import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useDesignDocumentFolders } from '@/hooks/use-design-document-folders';
import { useDesignDocumentGroups } from '@/hooks/use-design-document-groups';
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
import { Upload, X, File, FileText, FolderOpen } from 'lucide-react';
import UserSelector from '@/components/ui-custom/UserSelector';

const documentUploadSchema = z.object({
  created_by: z.string().min(1, 'El creador es obligatorio'),
  folder_id: z.string().min(1, 'Debe seleccionar una carpeta'),
  group_id: z.string().optional(),
  status: z.string().min(1, 'El estado es obligatorio'),
  visibility: z.string().min(1, 'La visibilidad es obligatoria'),
  group_description: z.string().optional(),
});

type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

interface DocumentUploadFormModalProps {
  modalData?: {
    defaultFolderId?: string;
    defaultGroupId?: string;
    editingGroup?: any;
  };
  onClose: () => void;
}

export function DocumentUploadFormModal({ modalData, onClose }: DocumentUploadFormModalProps) {
  const { defaultFolderId, defaultGroupId, editingGroup } = modalData || {};
  const isEditing = !!editingGroup;
  
  // Debug logging
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPanel } = useModalPanelStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<{ [key: number]: string }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: organizationMembers } = useOrganizationMembers(userData?.preferences?.last_organization_id || '');
  const { data: folders = [] } = useDesignDocumentFolders();
  const { data: groups = [] } = useDesignDocumentGroups(selectedFolderId);
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
      created_by: '',
      folder_id: defaultFolderId || '',
      group_id: defaultGroupId || '',
      status: 'pendiente',
      visibility: 'public',
      group_description: '',
    },
  });

  // Load existing group data when editing (delay until groups are loaded)
  useEffect(() => {
    if (isEditing && editingGroup && userData?.preferences && groups.length > 0) {
      setSelectedFolderId(editingGroup.folder_id || '');
      
      form.reset({
        created_by: editingGroup.created_by || userData.user.id,
        folder_id: editingGroup.folder_id || defaultFolderId || '',
        group_id: editingGroup.id || defaultGroupId || '',
        status: editingGroup.status || 'pendiente',
        visibility: editingGroup.visibility || 'public',
        group_description: editingGroup.description || '',
      });
    }
  }, [isEditing, editingGroup, userData, form, defaultFolderId, defaultGroupId, groups]);

  // Update selectedFolderId when form folder_id changes
  useEffect(() => {
    const folderId = form.watch('folder_id');
    setSelectedFolderId(folderId);
    if (folderId !== selectedFolderId) {
      form.setValue('group_id', ''); // Reset group when folder changes
    }
  }, [form.watch('folder_id'), selectedFolderId, form]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (userData && organizationMembers && !isEditing) {
      // Find current user's member ID in the organization
      const currentUserMember = organizationMembers.find(member => member.user_id === userData?.user?.id);
      
      form.reset({
        created_by: currentUserMember?.user_id || userData.user.id,
        folder_id: defaultFolderId || '',
        group_id: defaultGroupId || '',
        status: 'pendiente',
        visibility: 'public',
        group_description: '',
      });
      setSelectedFiles([]);
      setFileNames({});
      setUploadProgress(0);
    }
  }, [userData, organizationMembers, defaultFolderId, defaultGroupId, form, isEditing]);

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

      // Process each file
      const uploads = selectedFiles.map(async (file, index) => {
        const fileName = fileNames[index] || file.name.replace(/\.[^/.]+$/, '');
        
        // Upload file using the createDocumentMutation
        return createDocumentMutation.mutateAsync({
          file,
          file_name: fileName,
          description: data.group_description || '',
          folder_id: data.folder_id,
          group_id: data.group_id || undefined,
          status: data.status,
          visibility: data.visibility,
          created_by: data.created_by,
          organization_id: userData.preferences.last_organization_id,
          project_id: userData.preferences.last_project_id,
        });
      });

      return Promise.all(uploads);
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: `${selectedFiles.length > 1 ? 'Documentos subidos' : 'Documento subido'} correctamente`,
      });
      queryClient.invalidateQueries({ queryKey: ['design-documents'] });
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

  // Filter existing documents for this group
  const groupDocuments = existingDocuments.filter(doc => 
    isEditing && editingGroup && doc.group_id === editingGroup.id
  );

  const handleClose = () => {
    form.reset();
    setSelectedFiles([]);
    setFileNames({});
    setUploadProgress(0);
    onClose();
  };

  const onSubmit = (data: DocumentUploadFormData) => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos un archivo',
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate(data);
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Creator Field */}
        <FormField
          control={form.control}
          name="created_by"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Creado por <span className="text-[var(--accent)]">*</span></FormLabel>
              <FormControl>
                <UserSelector
                  users={organizationMembers?.map(member => ({
                    id: member.user_id,
                    full_name: member.full_name,
                    email: member.email,
                    avatar_url: member.avatar_url,
                    first_name: member.full_name.split(' ')[0] || '',
                    last_name: member.full_name.split(' ').slice(1).join(' ') || ''
                  })) || []}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar creador"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Folder Field */}
        <FormField
          control={form.control}
          name="folder_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carpeta <span className="text-[var(--accent)]">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Group Field */}
        <FormField
          control={form.control}
          name="group_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grupo/Entrega (opcional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un grupo existente o se generará uno automáticamente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Archivos <span className="text-[var(--accent)]">*</span>
            </label>
            <div 
              onClick={triggerFileInput}
              className="relative border-2 border-dashed border-[var(--card-border)] rounded-lg p-6 text-center hover:border-[var(--accent)] transition-colors cursor-pointer"
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
              <label className="block text-sm font-medium text-foreground">
                Archivos seleccionados ({selectedFiles.length})
              </label>
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
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description Field */}
        <FormField
          control={form.control}
          name="group_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descripción de los documentos"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status and Visibility Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibilidad</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la visibilidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Existing Documents Section (only in edit mode) */}
          {isEditing && groupDocuments.length > 0 && (
            <div className="col-span-full">
              <h4 className="text-sm font-medium mb-3">Documentos Existentes</h4>
              <div className="space-y-2">
                {groupDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc.file_name}</span>
                      <span className="text-xs text-muted-foreground">({doc.status})</span>
                    </div>
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
      title={isEditing ? "Editar Entrega de Documentos" : "Nueva Entrega de Documentos"}
      icon={FolderOpen}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isUploading ? "Subiendo..." : (isEditing ? "Actualizar Entrega" : "Nueva Entrega de Documentos")}
      onRightClick={form.handleSubmit(onSubmit)}
      rightLoading={isUploading}
      rightDisabled={selectedFiles.length === 0}
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