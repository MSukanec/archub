import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useCreateDesignDocumentFolder, useUpdateDesignDocumentFolder } from '@/hooks/use-design-document-folders';
import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FolderPlus, FolderOpen } from 'lucide-react';
import UserSelectorField from '@/components/ui-custom/fields/UserSelectorField';

const documentFolderSchema = z.object({
  name: z.string().min(1, 'El nombre de la carpeta es obligatorio'),
});

type DocumentFolderFormData = z.infer<typeof documentFolderSchema>;

interface DocumentFolderFormModalProps {
  modalData?: {
    parentId?: string;
    parentName?: string;
    editingFolder?: {
      id: string;
      name: string;
    };
  };
  onClose: () => void;
}

export function DocumentFolderFormModal({ modalData, onClose }: DocumentFolderFormModalProps) {
  const { parentId, parentName, editingFolder } = modalData || {};
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPanel } = useModalPanelStore();
  const organizationId = userData?.preferences?.last_organization_id;

  const { data: organizationMembers } = useOrganizationMembers(organizationId || '');
  const createFolderMutation = useCreateDesignDocumentFolder();
  const updateFolderMutation = useUpdateDesignDocumentFolder();

  const isEditing = !!editingFolder;

  // Initialize panel to edit mode when modal opens
  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  const form = useForm<DocumentFolderFormData>({
    resolver: zodResolver(documentFolderSchema),
    defaultValues: {
      name: '',
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (userData?.user?.id) {
      form.reset({
        name: editingFolder?.name || '',
      });
    }
  }, [userData, editingFolder, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: async (data: DocumentFolderFormData) => {
      if (!organizationId || !userData?.user?.id) {
        throw new Error('No hay organización seleccionada o usuario no autenticado');
      }

      const folderData = {
        name: data.name,
        parent_id: parentId || undefined,
      };

      if (isEditing && editingFolder) {
        return updateFolderMutation.mutateAsync({
          id: editingFolder.id,
          name: folderData.name,
        });
      } else {
        return createFolderMutation.mutateAsync(folderData);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: isEditing ? 'Carpeta actualizada correctamente' : 'Carpeta creada correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['design-document-folders'] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar la carpeta',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: DocumentFolderFormData) => {
    createMutation.mutate(data);
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Folder Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre de la carpeta <span className="text-[var(--accent)]">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={parentName ? `Subcarpeta de ${parentName}` : "Ej: Planos arquitectónicos, Documentos legales, etc."}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parent Info Display */}
        {parentName && (
          <div className="p-3 bg-muted/30 rounded-md border">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Esta será una subcarpeta de: <span className="font-medium text-foreground">{parentName}</span>
              </span>
            </div>
          </div>
        )}
      </form>
    </Form>
  );

  const viewPanel = editingFolder ? (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Nombre</h4>
        <p className="text-muted-foreground mt-1">{editingFolder.name}</p>
      </div>

      {parentName && (
        <div>
          <h4 className="font-medium">Carpeta padre</h4>
          <p className="text-muted-foreground mt-1">{parentName}</p>
        </div>
      )}
    </div>
  ) : null;

  const headerContent = (
    <FormModalHeader
      title={isEditing ? 'Editar Carpeta' : (parentName ? 'Nueva Subcarpeta' : 'Nueva Carpeta')}
      icon={isEditing ? FolderOpen : FolderPlus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Actualizar' : 'Crear'}
      onRightClick={form.handleSubmit(onSubmit)}
      submitDisabled={createMutation.isPending}
      showLoadingSpinner={createMutation.isPending}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}