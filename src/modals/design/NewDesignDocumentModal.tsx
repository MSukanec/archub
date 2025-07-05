import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { supabase } from '@/lib/supabase';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, X, File } from 'lucide-react';

const formSchema = z.object({
  design_phase_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface DesignDocument {
  id: string;
  file_name: string;
  file_size: number;
  design_phase_id?: string;
  created_by: string;
  created_at: string;
}

interface NewDesignDocumentModalProps {
  open: boolean;
  onClose: () => void;
  editingDocument?: DesignDocument | null;
}

export function NewDesignDocumentModal({ 
  open, 
  onClose, 
  editingDocument 
}: NewDesignDocumentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      folder: '',
      status: 'pendiente',
      visibility: 'public',
      design_phase_id: '',
    },
  });

  // Reset form when editing document changes
  useEffect(() => {
    if (editingDocument) {
      form.reset({
        name: editingDocument.name,
        description: editingDocument.description || '',
        folder: editingDocument.folder,
        status: editingDocument.status as any,
        visibility: editingDocument.visibility as any,
        design_phase_id: editingDocument.design_phase_id || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        folder: '',
        status: 'pendiente',
        visibility: 'public',
        design_phase_id: '',
      });
    }
  }, [editingDocument, form]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill name if empty
      if (!form.getValues('name')) {
        form.setValue('name', file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const uploadFile = async (file: File): Promise<{ path: string; url: string }> => {
    if (!userData?.user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase!.storage
      .from('design-documents')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase!.storage
      .from('design-documents')
      .getPublicUrl(filePath);

    return { path: filePath, url: publicUrl };
  };

  const createDocumentMutation = useMutation({
    mutationFn: async (values: FormData) => {
      if (!userData?.user?.id || !userData?.organization?.id || !userData?.preferences?.last_project_id) {
        throw new Error('Datos de usuario incompletos');
      }

      let filePath = '';
      let fileUrl = '';
      let fileType = '';

      if (selectedFile) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadFile(selectedFile);
          filePath = uploadResult.path;
          fileUrl = uploadResult.url;
          fileType = selectedFile.type;
        } catch (uploadError: any) {
          setIsUploading(false);
          throw new Error(`Error al subir archivo: ${uploadError.message}`);
        }
      } else if (editingDocument) {
        // Keep existing file info if editing without new file
        filePath = editingDocument.file_path;
        fileUrl = editingDocument.file_url;
        fileType = editingDocument.file_type;
      } else {
        throw new Error('Debe seleccionar un archivo');
      }

      const documentData = {
        file_name: selectedFile ? selectedFile.name : (editingDocument?.file_name || ''),
        file_size: selectedFile ? selectedFile.size : (editingDocument?.file_size || 0),
        design_phase_id: values.design_phase_id || null,
        created_by: userData.user.id,
      };

      if (editingDocument) {
        const { data, error } = await supabase!
          .from('design_documents')
          .update(documentData)
          .eq('id', editingDocument.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase!
          .from('design_documents')
          .insert([{
            ...documentData,
            created_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-documents'] });
      toast({
        title: editingDocument ? 'Documento actualizado' : 'Documento creado',
        description: editingDocument ? 'El documento ha sido actualizado correctamente' : 'El documento ha sido creado correctamente',
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error saving document:', error);
      let errorMessage = 'No se pudo guardar el documento';
      
      if (error.message?.includes('row-level security')) {
        errorMessage = 'Sin permisos para guardar el documento';
      } else if (error.message?.includes('upload')) {
        errorMessage = 'Error al subir el archivo';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleSubmit = (values: FormData) => {
    createDocumentMutation.mutate(values);
  };

  const handleCancel = () => {
    form.reset();
    setSelectedFile(null);
    onClose();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return FileText;
    if (file.type.includes('pdf')) return FileText;
    if (file.type.includes('word')) return FileText;
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return FileText;
    return File;
  };

  return (
    <CustomModalLayout 
      open={open} 
      onClose={onClose}
    >
      {{
        header: (
          <CustomModalHeader
            title={editingDocument ? 'Editar Documento' : 'Nuevo Documento'}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* File Upload Section */}
            <div className="space-y-3">
              <Label>Archivo</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-sm font-medium">Selecciona un archivo</p>
                      <p className="text-xs text-muted-foreground">
                        PDF, Word, Excel, Imágenes
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Seleccionar archivo
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Document Information */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre del documento" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Descripción del documento" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="folder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carpeta</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre de la carpeta" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                          <SelectValue placeholder="Selecciona visibilidad" />
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
                </div>
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleCancel}
            onSave={form.handleSubmit(handleSubmit)}
            saveText={editingDocument ? 'Actualizar' : 'Crear'}
            saveLoading={createDocumentMutation.isPending || isUploading}
          />
        )
      }}
    </CustomModalLayout>
  );
}