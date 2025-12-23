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
import { createProjectModality } from '../services/createProjectModality';
import { updateProjectModality } from '../services/updateProjectModality';
import { projectModalitySchema, type ProjectModalityFormData } from '../schemas';
import type { ProjectModality } from '../types';

interface ProjectModalityFormProps {
  modalData?: {
    projectModality?: ProjectModality;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

function ViewPanel({ data }: { data: ProjectModality }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Nombre</p>
        <p className="font-medium">{data.name}</p>
      </div>
      {data.organization_id === null && (
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
          Modalidad del sistema
        </div>
      )}
    </div>
  );
}

function FormPanel({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ProjectModalityFormData>>;
  onSubmit: (data: ProjectModalityFormData) => void;
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
                  placeholder="Nombre de la modalidad"
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
}

export function ProjectModalityModal({ modalData, onClose, mode = 'create' }: ProjectModalityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { projectModality } = modalData || {};
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

  const createMutation = useMutation({
    mutationFn: createProjectModality,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-modalities', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['project-modalities'] });
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
      data: { name?: string };
    }) => updateProjectModality(modalityId, organizationId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-modalities', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['project-modalities'] });
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

  const onSubmit = async (data: ProjectModalityFormData) => {
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
      if (mode === 'edit' && projectModality) {
        await updateMutation.mutateAsync({
          modalityId: projectModality.id,
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
          title: 'Detalle de Modalidad',
          description: 'Información de la modalidad de proyecto'
        };
      case 'edit':
        return {
          title: 'Editar Modalidad',
          description: 'Modifica los datos de la modalidad de proyecto'
        };
      case 'create':
      default:
        return {
          title: 'Nueva Modalidad',
          description: 'Crea una nueva modalidad de proyecto para tu organización'
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
        {mode === 'view' && projectModality ? (
          <ViewPanel data={projectModality} />
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
