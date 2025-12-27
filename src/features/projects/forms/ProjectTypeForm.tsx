import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useOptimisticMutation } from '@/core/save-engine';
import { projectsKeys } from '@/core/query-keys';
import { useCurrentUser } from '@/features/users/hooks';
import { useOrganizationMembers } from '@/features/organization/hooks/use-organization-members';
import { createProjectType } from '../services/createProjectType';
import { updateProjectType } from '../services/updateProjectType';
import { projectTypeSchema, type ProjectTypeFormData } from '../schemas';
import type { ProjectType } from '../types';

interface ProjectTypeFormCallbacks {
  onSuccess?: (mode: 'create' | 'edit') => void;
  onError?: (error: Error) => void;
}

interface UseProjectTypeFormOptions {
  projectType?: ProjectType;
  mode: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
  callbacks?: ProjectTypeFormCallbacks;
}

export function ViewPanel({ data }: { data: ProjectType }) {
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

export function FormPanel({
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

export function useProjectTypeForm({
  projectType,
  mode,
  onSuccess,
  callbacks = {},
}: UseProjectTypeFormOptions) {
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

  const reset = () => {
    form.reset();
  };

  const { mutate: createType, isPending: isCreating } = useOptimisticMutation<
    void,
    { name: string; organizationId: string; createdBy: string }
  >({
    mutationFn: async (data) => createProjectType(data),
    queryKey: projectsKeys.typeList(organizationId),
    optimisticUpdate: (oldData, variables) => {
      const optimisticType = {
        id: 'temp-' + Date.now(),
        name: variables.name,
        organization_id: variables.organizationId,
        created_by: variables.createdBy,
        created_at: new Date().toISOString(),
      };
      if (!Array.isArray(oldData)) return [optimisticType];
      return [...oldData, optimisticType];
    },
    onSuccessMessage: "Tipo creado",
    onErrorMessage: "Error al crear tipo",
    additionalQueryKeys: [projectsKeys.types()],
  });

  const { mutate: updateType, isPending: isUpdating } = useOptimisticMutation<
    void,
    { typeId: string; organizationId: string; data: { name?: string } }
  >({
    mutationFn: async ({ typeId, organizationId: orgId, data }) => 
      updateProjectType(typeId, orgId, data),
    queryKey: projectsKeys.typeList(organizationId),
    optimisticUpdate: (oldData, variables) => {
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map((t: any) => 
        t.id === variables.typeId ? { ...t, ...variables.data } : t
      );
    },
    onSuccessMessage: "Tipo actualizado",
    onErrorMessage: "Error al actualizar tipo",
    additionalQueryKeys: [projectsKeys.types()],
  });

  const isSubmitting = isCreating || isUpdating;

  const onSubmit = async (data: ProjectTypeFormData) => {
    if (!organizationId) {
      callbacks.onError?.(new Error('Faltan datos de organización'));
      return;
    }

    try {
      if (mode === 'edit' && projectType) {
        updateType({
          typeId: projectType.id,
          organizationId,
          data: { name: data.name }
        });
        callbacks.onSuccess?.('edit');
        onSuccess?.();
      } else {
        const currentMember = members.find((m: any) => m.user_id === userData?.user?.id);
        if (!currentMember) {
          callbacks.onError?.(new Error('No se encontró el miembro de la organización'));
          return;
        }

        createType({
          name: data.name,
          organizationId,
          createdBy: currentMember.id
        });
        callbacks.onSuccess?.('create');
        onSuccess?.();
      }
    } catch (error) {
      callbacks.onError?.(error as Error);
    }
  };

  return {
    form,
    onSubmit,
    reset,
    isSubmitting,
    organizationId,
  };
}

export type { ProjectType, ProjectTypeFormData };
