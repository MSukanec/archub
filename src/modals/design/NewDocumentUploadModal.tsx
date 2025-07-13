import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useDesignDocumentFolders, useCreateDesignDocumentFolder } from '@/hooks/use-design-document-folders';
import { useDesignDocumentGroups, useCreateDesignDocumentGroup } from '@/hooks/use-design-document-groups';
import { useCreateDesignDocument } from '@/hooks/use-design-documents';
import { supabase } from '@/lib/supabase';
import { CustomModalLayout } from '@/components/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/modal/CustomModalFooter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboBox } from '@/components/ui-custom/ComboBox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  File, 
  FileText, 
  FolderOpen, 
  FolderPlus,
  Plus 
} from 'lucide-react';

const formSchema = z.object({
  folder_id: z.string().min(1, 'La carpeta es requerida'),
  group_id: z.string().min(1, 'El grupo es requerido'),
  status: z.enum(['pendiente', 'en_revision', 'aprobado', 'rechazado']),
  visibility: z.enum(['public', 'private']).optional(),
  group_description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NewDocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  defaultFolderId?: string;
  defaultGroupId?: string;
}

export function NewDocumentUploadModal({ 
  open, 
  onClose, 
  defaultFolderId,
  defaultGroupId 
}: NewDocumentUploadModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const { data: folders = [] } = useDesignDocumentFolders();
  const { data: groups = [] } = useDesignDocumentGroups(selectedFolderId);
  const createFolderMutation = useCreateDesignDocumentFolder();
  const createGroupMutation = useCreateDesignDocumentGroup();
  const createDocumentMutation = useCreateDesignDocument();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      folder_id: defaultFolderId || '',
      group_id: defaultGroupId || '',
      status: 'pendiente',
      visibility: 'public',
      group_description: '',
    },
  });

  // Update selectedFolderId when form folder_id changes
  useEffect(() => {
    const folderId = form.watch('folder_id');
    setSelectedFolderId(folderId);
    if (folderId !== selectedFolderId) {
      form.setValue('group_id', ''); // Reset group when folder changes
    }
  }, [form.watch('folder_id'), selectedFolderId]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        folder_id: defaultFolderId || '',
        group_id: defaultGroupId || '',
        status: 'pendiente',
        visibility: 'public',
        group_description: '',
      });
      setSelectedFiles([]);
      setIsCreatingNewGroup(false);
      setNewGroupName('');
      setUploadProgress(0);
    }
  }, [open, defaultFolderId, defaultGroupId, form]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const createFolder = async (folderName: string) => {
    const newFolder = await createFolderMutation.mutateAsync(folderName);
    toast({
      title: "Carpeta creada",
      description: `La carpeta "${newFolder.name}" ha sido creada exitosamente.`
    });
    return { value: newFolder.id, label: newFolder.name };
  };

  const uploadFile = async (file: File, projectId: string, folderId: string, groupId: string): Promise<{ path: string; url: string }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${projectId}/${folderId}/${groupId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('design-documents')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('design-documents')
      .getPublicUrl(filePath);

    return { path: filePath, url: publicUrl };
  };

  const handleSubmit = async (values: FormData) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un archivo",
        variant: "destructive"
      });
      return;
    }

    if (!userData?.user?.id || !userData?.organization?.id || !userData?.preferences?.last_project_id) {
      toast({
        title: "Error",
        description: "Datos de usuario incompletos",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let groupId = values.group_id;

      // Create new group if needed
      if (isCreatingNewGroup && newGroupName.trim()) {
        const newGroup = await createGroupMutation.mutateAsync({
          name: newGroupName.trim(),
          description: values.group_description,
          folder_id: values.folder_id,
        });
        groupId = newGroup.id;
        toast({
          title: "Grupo creado",
          description: `El grupo "${newGroup.name}" ha sido creado exitosamente.`
        });
      }

      // Upload files one by one
      const totalFiles = selectedFiles.length;
      const uploadPromises = selectedFiles.map(async (file, index) => {
        try {
          const uploadResult = await uploadFile(
            file, 
            userData.preferences.last_project_id, 
            values.folder_id, 
            groupId
          );

          const documentName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension

          await createDocumentMutation.mutateAsync({
            name: documentName,
            file_name: file.name,
            file_path: uploadResult.path,
            file_url: uploadResult.url,
            file_type: file.type,
            file_size: file.size,
            group_id: groupId,
            status: values.status,
            visibility: values.visibility,
          });

          setUploadProgress(Math.round(((index + 1) / totalFiles) * 100));
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw error;
        }
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Documentos subidos",
        description: `Se han subido ${totalFiles} archivo${totalFiles !== 1 ? 's' : ''} exitosamente.`
      });

      form.reset();
      setSelectedFiles([]);
      onClose();
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron subir los documentos",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    form.reset();
    setSelectedFiles([]);
    onClose();
  };

  const folderOptions = folders.map(folder => ({
    value: folder.id,
    label: folder.name
  }));

  const groupOptions = groups.map(group => ({
    value: group.id,
    label: group.name
  }));

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title="Subir Documentos"
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                
                {/* Carpeta */}
                <FormField
                  control={form.control}
                  name="folder_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carpeta <span className="text-[var(--accent)]">*</span></FormLabel>
                      <FormControl>
                        <ComboBox
                          value={field.value}
                          onValueChange={field.onChange}
                          options={folderOptions}
                          placeholder="Seleccionar o crear carpeta..."
                          searchPlaceholder="Buscar o crear carpeta..."
                          emptyMessage="No se encontraron carpetas."
                          allowCreate={true}
                          onCreateNew={createFolder}
                          createLabel={(value) => `Crear carpeta "${value}"`}
                          createIcon={<FolderPlus className="h-4 w-4" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Grupo/Entrega */}
                <FormField
                  control={form.control}
                  name="group_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo/Entrega <span className="text-[var(--accent)]">*</span></FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          {!isCreatingNewGroup ? (
                            <div className="flex gap-2">
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                                disabled={!selectedFolderId}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Selecciona un grupo existente" />
                                </SelectTrigger>
                                <SelectContent>
                                  {groupOptions.map((group) => (
                                    <SelectItem key={group.value} value={group.value}>
                                      {group.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCreatingNewGroup(true)}
                                disabled={!selectedFolderId}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Nombre del nuevo grupo"
                                  value={newGroupName}
                                  onChange={(e) => setNewGroupName(e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setIsCreatingNewGroup(false);
                                    setNewGroupName('');
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <FormField
                                control={form.control}
                                name="group_description"
                                render={({ field }) => (
                                  <Textarea
                                    placeholder="Descripción del grupo (opcional)"
                                    rows={2}
                                    {...field}
                                  />
                                )}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Archivos */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Archivos <span className="text-[var(--accent)]">*</span>
                  </label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.ppt,.pptx"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Haz clic para seleccionar archivos o arrastra y suelta
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, Word, Excel, Imágenes, PowerPoint
                      </p>
                    </label>
                  </div>
                </div>

                {/* Lista de archivos seleccionados */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Archivos seleccionados ({selectedFiles.length})
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
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
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estado */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_revision">En revisión</SelectItem>
                          <SelectItem value="aprobado">Aprobado</SelectItem>
                          <SelectItem value="rechazado">Rechazado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Progress bar durante upload */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subiendo archivos...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleCancel}
            onSubmit={form.handleSubmit(handleSubmit)}
            submitText={isUploading ? 'Subiendo...' : 'Subir Documentos'}
            cancelText="Cancelar"
            submitDisabled={isUploading || selectedFiles.length === 0}
            cancelDisabled={isUploading}
          />
        )
      }}
    </CustomModalLayout>
  );
}