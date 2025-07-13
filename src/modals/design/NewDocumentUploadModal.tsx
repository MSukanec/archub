import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useDesignDocumentFolders, useCreateDesignDocumentFolder } from '@/hooks/use-design-document-folders';
import { useDesignDocumentGroups } from '@/hooks/use-design-document-groups';
import { useCreateDesignDocument } from '@/hooks/use-design-documents';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
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
import UserSelector from '@/components/ui-custom/UserSelector';
import { 
  Upload, 
  X, 
  File, 
  FileText, 
  FolderOpen, 
  FolderPlus
} from 'lucide-react';

const formSchema = z.object({
  created_by: z.string().min(1, 'El creador es requerido'),
  folder_id: z.string().min(1, 'La carpeta es requerida'),
  group_id: z.string().optional(), // Ya no es requerido
  status: z.enum(['pendiente', 'en_revision', 'aprobado', 'rechazado']),
  visibility: z.enum(['public', 'private']).optional(),
  group_description: z.string().optional(), // Descripción para la nueva entrega
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
  const { data: members = [] } = useOrganizationMembers(
    userData?.preferences?.last_organization_id
  );
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<{ [key: number]: string }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  const { data: folders = [] } = useDesignDocumentFolders();
  const { data: groups = [] } = useDesignDocumentGroups(selectedFolderId);
  const createFolderMutation = useCreateDesignDocumentFolder();
  const createDocumentMutation = useCreateDesignDocument();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      created_by: '',
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
    if (open && userData && members.length > 0) {
      // Find current user's member ID in the organization
      const currentUserMember = members.find(member => member.user_id === userData?.user?.id);
      
      form.reset({
        created_by: currentUserMember?.id || '',
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
  }, [open, defaultFolderId, defaultGroupId, form, userData, members]);

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
      [index]: name
    }));
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

      // Si no hay grupo seleccionado, generar uno automáticamente
      if (!groupId) {
        // Generar nombre automático usando RPC
        const { data: generatedName, error: rpcError } = await supabase.rpc('generate_next_document_group_name', {
          p_folder_id: values.folder_id
        });

        if (rpcError) {
          throw new Error(`Error generando nombre de entrega: ${rpcError.message}`);
        }

        // Crear nueva entrega con nombre generado
        const { data: newGroup, error: groupError } = await supabase
          .from('design_document_groups')
          .insert({
            folder_id: values.folder_id,
            name: generatedName,
            description: values.group_description || '',
            created_by: userData.user.id,
            organization_id: userData.organization.id,
            project_id: userData.preferences.last_project_id,
          })
          .select()
          .single();

        if (groupError) {
          throw new Error(`Error creando entrega: ${groupError.message}`);
        }

        groupId = newGroup.id;
        
        toast({
          title: "Entrega generada",
          description: `Se ha creado la entrega "${generatedName}" automáticamente.`
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

          // Use custom name from user input or fallback to filename without extension
          const customName = fileNames[index] || file.name.replace(/\.[^/.]+$/, '');

          await createDocumentMutation.mutateAsync({
            name: customName, // User-provided name
            file_name: file.name, // Original filename
            file_path: uploadResult.path,
            file_url: uploadResult.url,
            file_type: file.type,
            file_size: file.size,
            group_id: groupId,
            status: values.status,
            visibility: values.visibility,
            created_by: values.created_by,
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

      // Invalidar cache para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['design-document-groups'] });
      queryClient.invalidateQueries({ queryKey: ['design-documents'] });

      form.reset();
      setSelectedFiles([]);
      setFileNames({});
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
                
                {/* Creado por */}
                <FormField
                  control={form.control}
                  name="created_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creado por <span className="text-[var(--accent)]">*</span></FormLabel>
                      <FormControl>
                        <UserSelector
                          users={members}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecciona el creador del documento"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormLabel>Grupo/Entrega (opcional)</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!selectedFolderId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un grupo existente o se generará uno automáticamente" />
                          </SelectTrigger>
                          <SelectContent>
                            {groupOptions.map((group) => (
                              <SelectItem key={group.value} value={group.value}>
                                {group.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.svg,.dwg,.dxf,.skp,.3ds,.max,.obj,.fbx,.dae,.stl,.ply,.zip,.rar,.7z"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Haz clic aquí para seleccionar archivos
                      </span>
                      <span className="text-xs text-muted-foreground/70">
                        Formatos soportados: PDF, DOC, XLS, PPT, imágenes, CAD, 3D, comprimidos
                      </span>
                    </label>
                  </div>
                </div>

                {/* Lista de archivos seleccionados con nombres personalizables */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Archivos seleccionados:</h4>
                    <div className="space-y-3">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="space-y-2 p-3 bg-muted rounded-lg">
                          {/* File info header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <File className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Archivo: {file.name}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Custom name input */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Nombre para mostrar:
                            </label>
                            <Input
                              placeholder="Ingrese el nombre que se mostrará para este documento"
                              value={fileNames[index] || ''}
                              onChange={(e) => updateFileName(index, e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Descripción de la entrega */}
                <FormField
                  control={form.control}
                  name="group_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción que se aplicará a la entrega generada automáticamente"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Progreso de subida */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Subiendo archivos...</span>
                      <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Estado y Visibilidad */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="en_revision">En revisión</SelectItem>
                              <SelectItem value="aprobado">Aprobado</SelectItem>
                              <SelectItem value="rechazado">Rechazado</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
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
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona la visibilidad" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Público</SelectItem>
                              <SelectItem value="private">Privado</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSubmit={form.handleSubmit(handleSubmit)}
            submitText={isUploading ? "Subiendo..." : "Subir Documentos"}
            cancelText="Cancelar"
            disabled={isUploading || selectedFiles.length === 0}
          />
        )
      }}
    </CustomModalLayout>
  );
}