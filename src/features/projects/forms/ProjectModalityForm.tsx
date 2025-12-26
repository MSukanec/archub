import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useOptimisticMutation } from '@/core/save-engine';
import { projectsKeys } from '@/core/query-keys';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/features/organization/hooks/use-organization-members';
import { createProjectModality } from '../services/createProjectModality';
import { updateProjectModality } from '../services/updateProjectModality';
import { projectModalitySchema, type ProjectModalityFormData } from '../schemas';
import type { ProjectModality } from '../types';

interface ProjectModalityFormCallbacks {
  onSuccess?: (mode: 'create' | 'edit') => void;
  onError?: (error: Error) => void;
}

interface UseProjectModalityFormOptions {
  projectModality?: ProjectModality;
  mode: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
  callbacks?: ProjectModalityFormCallbacks;
}

export function ViewPanel({ data }: { data: ProjectModality }) {
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

export function FormPanel({
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

export function useProjectModalityForm({
  projectModality,
  mode,
  onSuccess,
  callbacks = {},
}: UseProjectModalityFormOptions) {
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

  const reset = () => {
    form.reset();
  };

  const { mutate: createModality, isPending: isCreating } = useOptimisticMutation({
    mutationFn: async (data: { name: string; organizationId: string; createdBy: string }) => {
      return createProjectModality(data);
    },
    queryKey: projectsKeys.modalityList(organizationId),
    optimisticUpdate: (oldData: ProjectModality[] | undefined, variables) => {
      const optimisticModality = {
        id: 'temp-' + Date.now(),
        name: variables.name,
        organization_id: variables.organizationId,
        created_by: variables.createdBy,
        created_at: new Date().toISOString(),
      };
      if (!Array.isArray(oldData)) return [optimisticModality];
      return [...oldData, optimisticModality];
    },
    onSuccessMessage: "Modalidad creada",
    onErrorMessage: "Error al crear modalidad",
    additionalQueryKeys: [projectsKeys.modalities()],
  });

  const { mutate: updateModality, isPending: isUpdating } = useOptimisticMutation({
    mutationFn: async (data: { modalityId: string; organizationId: string; name: string }) => {
      return updateProjectModality(data.modalityId, data.organizationId, { name: data.name });
    },
    queryKey: projectsKeys.modalityList(organizationId),
    optimisticUpdate: (oldData: ProjectModality[] | undefined, variables) => {
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map((m) => 
        m.id === variables.modalityId ? { ...m, name: variables.name } : m
      );
    },
    onSuccessMessage: "Modalidad actualizada",
    onErrorMessage: "Error al actualizar modalidad",
    additionalQueryKeys: [projectsKeys.modalities()],
  });

  const onSubmit = async (data: ProjectModalityFormData) => {
    if (!organizationId) {
      callbacks.onError?.(new Error('Faltan datos de organización'));
      return;
    }

    if (mode === 'edit' && projectModality) {
      updateModality({
        modalityId: projectModality.id,
        organizationId,
        name: data.name,
      });
      callbacks.onSuccess?.('edit');
      onSuccess?.();
    } else {
      const currentMember = members.find((m: any) => m.user_id === userData?.user?.id);
      if (!currentMember) {
        callbacks.onError?.(new Error('No se encontró el miembro de la organización'));
        return;
      }

      createModality({
        name: data.name,
        organizationId,
        createdBy: currentMember.id,
      });
      callbacks.onSuccess?.('create');
      onSuccess?.();
    }
  };

  return {
    form,
    onSubmit,
    reset,
    isSubmitting: isCreating || isUpdating,
    organizationId,
  };
}

export type { ProjectModality, ProjectModalityFormData };
