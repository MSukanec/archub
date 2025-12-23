import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useCurrentUser } from '@/hooks/use-current-user';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const reset = () => {
    form.reset();
  };

  const createMutation = useMutation({
    mutationFn: createProjectType,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-types', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['project-types'] });
      callbacks.onSuccess?.('create');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error creating project type:', error);
      callbacks.onError?.(error as Error);
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
      callbacks.onSuccess?.('edit');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error updating project type:', error);
      callbacks.onError?.(error as Error);
    }
  });

  const onSubmit = async (data: ProjectTypeFormData) => {
    if (!organizationId) {
      callbacks.onError?.(new Error('Faltan datos de organización'));
      return;
    }

    try {
      if (mode === 'edit' && projectType) {
        // ⚡ STEP 1: OPTIMISTIC UPDATE PRIMERO
        queryClient.setQueryData(
          ['project-types', organizationId],
          (oldData: any) => {
            if (!Array.isArray(oldData)) return oldData;
            return oldData.map((t: any) => 
              t.id === projectType.id ? { ...t, name: data.name } : t
            );
          }
        );

        // ⚡ STEP 2: FIRE AND FORGET - Mutation sin esperar
        updateMutation.mutate({
          typeId: projectType.id,
          organizationId,
          data: { name: data.name }
        });

        // ✅ CALLBACK INMEDIATO
        callbacks.onSuccess?.('edit');
      } else {
        const currentMember = members.find((m: any) => m.user_id === userData?.user?.id);
        if (!currentMember) {
          callbacks.onError?.(new Error('No se encontró el miembro de la organización'));
          return;
        }

        // ⚡ STEP 1: OPTIMISTIC UPDATE
        const optimisticType = {
          id: 'temp-' + Date.now(),
          name: data.name,
          organization_id: organizationId,
          created_by: currentMember.id,
          created_at: new Date().toISOString(),
        };

        queryClient.setQueryData(
          ['project-types', organizationId],
          (oldData: any) => {
            if (!Array.isArray(oldData)) return [optimisticType];
            return [...oldData, optimisticType];
          }
        );

        // ⚡ STEP 2: FIRE AND FORGET
        createMutation.mutate({
          name: data.name,
          organizationId,
          createdBy: currentMember.id
        }, {
          onSuccess: (newType) => {
            // Reemplazar optimista con real
            queryClient.setQueryData(
              ['project-types', organizationId],
              (oldData: any) => {
                if (!Array.isArray(oldData)) return [newType];
                return oldData.map((t: any) => t.id === optimisticType.id ? newType : t);
              }
            );
          }
        });

        // ✅ CALLBACK INMEDIATO
        callbacks.onSuccess?.('create');
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
