import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/features/organization/hooks/use-organization-members';
import { createProjectType } from '../services/createProjectType';
import { updateProjectType } from '../services/updateProjectType';
import type { ProjectType } from '../services/getProjectTypes';

// Schema de validación
const projectTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
});

type ProjectTypeFormData = z.infer<typeof projectTypeSchema>;

interface ProjectTypeModalProps {
  modalData?: {
    projectType?: ProjectType;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ProjectTypeModal({ modalData, onClose }: ProjectTypeModalProps) {
  const { projectType, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: members = [] } = useOrganizationMembers(organizationId);

  const form = useForm<ProjectTypeFormData>({
    resolver: zodResolver(projectTypeSchema),
    defaultValues: {
      name: '',
    }
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (projectType) {
      form.reset({
        name: projectType.name || '',
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [projectType, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Define mutations inline siguiendo el patrón GOLD STANDARD
  const createMutation = useMutation({
    mutationFn: createProjectType,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-types', variables.organizationId] });
      toast({
        title: 'Tipo creado',
        description: 'El tipo de proyecto se creó correctamente'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating project type:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el tipo de proyecto',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ typeId, organizationId, data }: {
      typeId: string;
      organizationId: string;
      data: any;
    }) => updateProjectType(typeId, organizationId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-types', variables.organizationId] });
      toast({
        title: 'Tipo actualizado',
        description: 'El tipo de proyecto se actualizó correctamente'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating project type:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el tipo de proyecto',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: ProjectTypeFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener la información de la organización',
        variant: 'destructive'
      });
      return;
    }

    if (isEditing && projectType) {
      updateMutation.mutate({
        typeId: projectType.id,
        organizationId: userData.organization.id,
        data: {
          name: data.name,
        }
      });
    } else {
      // Obtener el organization_member.id del usuario actual
      const currentMember = members.find((m: any) => m.user_id === userData?.user?.id);
      if (!currentMember) {
        toast({
          title: 'Error',
          description: 'No se encontró el miembro de la organización para el usuario actual',
          variant: 'destructive'
        });
        return;
      }

      createMutation.mutate({
        name: data.name,
        organizationId: userData.organization.id,
        createdBy: currentMember.id,
      });
    }
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Edificio Residencial" 
                  {...field}
                  data-testid="input-project-type-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? 'Editar Tipo' : 'Nuevo Tipo'}
      description={isEditing 
        ? 'Modifica los detalles del tipo de proyecto'
        : 'Crea un nuevo tipo de proyecto personalizado para tu organización'
      }
      icon={Tag}
    />
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Guardar Cambios' : 'Crear Tipo'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div></div>}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
    />
  );
}
