import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/features/organization/hooks/use-organization-members';
import { createProjectType } from '../services/createProjectType';
import { updateProjectType } from '../services/updateProjectType';
import { projectTypeSchema, type ProjectTypeFormData } from '../schemas';
import type { ProjectType } from '../types';

interface ProjectTypeFormProps {
  modalData?: {
    projectType?: ProjectType;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

function ViewPanel({ data }: { data: ProjectType }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Nombre</p>
        <p className="font-medium">{data.name}</p>
      </div>
      {data.organization_id === null && (
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
          Tipo del sistema
        </div>
      )}
    </div>
  );
}

function FormPanel({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ProjectTypeFormData>>;
  onSubmit: (data: ProjectTypeFormData) => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre del tipo"
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
}

export function ProjectTypeForm({ modalData, onClose, mode = 'create' }: ProjectTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { projectType } = modalData || {};
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

  const createMutation = useMutation({
    mutationFn: createProjectType,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-types', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['project-types'] });
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
      data: { name?: string };
    }) => updateProjectType(typeId, organizationId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-types', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['project-types'] });
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

  const onSubmit = async (data: ProjectTypeFormData) => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Faltan datos de organización',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'edit' && projectType) {
        await updateMutation.mutateAsync({
          typeId: projectType.id,
          organizationId,
          data: { name: data.name }
        });
      } else {
        const currentMember = members.find((m: any) => m.user_id === userData?.user?.id);
        if (!currentMember) {
          toast({
            title: 'Error',
            description: 'No se encontró el miembro de la organización',
            variant: 'destructive'
          });
          return;
        }

        await createMutation.mutateAsync({
          name: data.name,
          organizationId,
          createdBy: currentMember.id
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: 'Detalle de Tipo',
          description: 'Información del tipo de proyecto'
        };
      case 'edit':
        return {
          title: 'Editar Tipo',
          description: 'Modifica los datos del tipo de proyecto'
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Tipo',
          description: 'Crea un nuevo tipo de proyecto para tu organización'
        };
    }
  };

  const header = getHeader();

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader 
        title={header.title}
        description={header.description}
        icon={Tag}
      />
      
      <ModalBody>
        {mode === 'view' && projectType ? (
          <ViewPanel data={projectType} />
        ) : (
          <FormPanel form={form} onSubmit={onSubmit} />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={handleClose}
          rightLabel={mode === 'create' ? 'Crear' : 'Actualizar'}
          onRightClick={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitDisabled={isSubmitting}
        />
      )}
    </ModalLayout>
  );
}
