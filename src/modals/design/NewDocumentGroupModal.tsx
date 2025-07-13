import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useDesignDocumentFolders } from '@/hooks/use-design-document-folders';
import { useCreateDesignDocumentGroup, useUpdateDesignDocumentGroup, DesignDocumentGroup } from '@/hooks/use-design-document-groups';
import { CustomModalLayout } from '@/components/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/modal/CustomModalFooter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  folder_id: z.string().min(1, 'La carpeta es requerida'),
});

type FormData = z.infer<typeof formSchema>;

interface NewDocumentGroupModalProps {
  open: boolean;
  onClose: () => void;
  editingGroup?: DesignDocumentGroup | null;
  defaultFolderId?: string;
}

export function NewDocumentGroupModal({ 
  open, 
  onClose, 
  editingGroup,
  defaultFolderId 
}: NewDocumentGroupModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: folders = [] } = useDesignDocumentFolders();
  const createGroupMutation = useCreateDesignDocumentGroup();
  const updateGroupMutation = useUpdateDesignDocumentGroup();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      folder_id: defaultFolderId || '',
    },
  });

  // Reset form when modal opens/closes or editing group changes
  useEffect(() => {
    if (open) {
      if (editingGroup) {
        form.reset({
          name: editingGroup.name || '',
          description: editingGroup.description || '',
          folder_id: editingGroup.folder_id || '',
        });
      } else {
        form.reset({
          name: '',
          description: '',
          folder_id: defaultFolderId || '',
        });
      }
    }
  }, [open, editingGroup, defaultFolderId, form]);

  const handleSubmit = async (values: FormData) => {
    try {
      if (editingGroup) {
        await updateGroupMutation.mutateAsync({
          id: editingGroup.id,
          name: values.name,
          description: values.description,
        });
        toast({
          title: "Grupo actualizado",
          description: "El grupo documental ha sido actualizado exitosamente."
        });
      } else {
        await createGroupMutation.mutateAsync({
          name: values.name,
          description: values.description,
          folder_id: values.folder_id,
        });
        toast({
          title: "Grupo creado",
          description: "El grupo documental ha sido creado exitosamente."
        });
      }
      
      form.reset();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el grupo",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  const isLoading = createGroupMutation.isPending || updateGroupMutation.isPending;

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingGroup ? 'Editar Grupo' : 'Nueva Entrega'}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                
                {/* Carpeta (solo si no está editando) */}
                {!editingGroup && (
                  <FormField
                    control={form.control}
                    name="folder_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carpeta <span className="text-[var(--accent)]">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una carpeta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {folders.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                <div className="flex items-center gap-2">
                                  <FolderOpen className="w-4 h-4" />
                                  <span>{folder.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la entrega <span className="text-[var(--accent)]">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Planos de arquitectura, Renders finales, etc."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción opcional del grupo documental"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : (editingGroup ? 'Actualizar' : 'Crear Grupo')}
            </Button>
          </CustomModalFooter>
        )
      }}
    </CustomModalLayout>
  );
}