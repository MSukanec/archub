import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/features/organization/hooks/use-organization-members';
import { createProjectModality } from '../services/createProjectModality';
import { updateProjectModality } from '../services/updateProjectModality';
import type { ProjectModality } from '../services/getProjectModalities';

// Schema de validación
const projectModalitySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
});

type ProjectModalityFormData = z.infer<typeof projectModalitySchema>;

interface ProjectModalityModalProps {
  modalData?: {
    projectModality?: ProjectModality;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ProjectModalityModal({ modalData, onClose }: ProjectModalityModalProps) {
  const { projectModality, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: members = [] } = useOrganizationMembers(organizationId);

  const form = useForm<ProjectModalityFormData>({
    resolver: zodResolver(projectModalitySchema),
    defaultValues: {
      name: '',
    }
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (projectModality) {
      form.reset({
        name: projectModality.name || '',
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [projectModality, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Define mutations inline siguiendo el patrón GOLD STANDARD
  const createMutation = useMutation({
    mutationFn: createProjectModality,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-modalities', variables.organizationId] });
      toast({
        title: 'Modalidad creada',
        description: 'La modalidad de proyecto se creó correctamente'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating project modality:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la modalidad de proyecto',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ modalityId, organizationId, data }: {
      modalityId: string;
      organizationId: string;
      data: ProjectModalityFormData;
    }) => updateProjectModality(modalityId, organizationId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-modalities', variables.organizationId] });
      toast({
        title: 'Modalidad actualizada',
        description: 'La modalidad de proyecto se actualizó correctamente'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating project modality:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la modalidad de proyecto',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: ProjectModalityFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener la información de la organización',
        variant: 'destructive'
      });
      return;
    }

    // Validar que no se intente editar una modalidad del sistema
    if (isEditing && projectModality) {
      if (projectModality.organization_id === null) {
        toast({
          title: 'Operación no permitida',
          description: 'No se pueden modificar las modalidades del sistema',
          variant: 'destructive'
        });
        return;
      }

      updateMutation.mutate({
        modalityId: projectModality.id,
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
                  placeholder="Ej: Obra Nueva" 
                  {...field}
                  data-testid="input-project-modality-name"
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
      title={isEditing ? 'Editar Modalidad' : 'Nueva Modalidad'}
      description={isEditing 
        ? 'Modifica los detalles de la modalidad de proyecto'
        : 'Crea una nueva modalidad de proyecto personalizada para tu organización'
      }
      icon={Tag}
    />
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Guardar Cambios' : 'Crear Modalidad'}
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
