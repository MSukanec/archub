import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const reset = () => {
    form.reset();
  };

  const createMutation = useMutation({
    mutationFn: createProjectModality,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-modalities', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['project-modalities'] });
      callbacks.onSuccess?.('create');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error creating project modality:', error);
      callbacks.onError?.(error as Error);
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
      callbacks.onSuccess?.('edit');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error updating project modality:', error);
      callbacks.onError?.(error as Error);
    }
  });

  const onSubmit = async (data: ProjectModalityFormData) => {
    if (!organizationId) {
      callbacks.onError?.(new Error('Faltan datos de organización'));
      return;
    }

    try {
      if (mode === 'edit' && projectModality) {
        // ⚡ STEP 1: OPTIMISTIC UPDATE PRIMERO
        queryClient.setQueryData(
          ['project-modalities', organizationId],
          (oldData: any) => {
            if (!Array.isArray(oldData)) return oldData;
            return oldData.map((m: any) => 
              m.id === projectModality.id ? { ...m, name: data.name } : m
            );
          }
        );

        // ⚡ STEP 2: FIRE AND FORGET - Mutation sin esperar
        updateMutation.mutate({
          modalityId: projectModality.id,
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
        const optimisticModality = {
          id: 'temp-' + Date.now(),
          name: data.name,
          organization_id: organizationId,
          created_by: currentMember.id,
          created_at: new Date().toISOString(),
        };

        queryClient.setQueryData(
          ['project-modalities', organizationId],
          (oldData: any) => {
            if (!Array.isArray(oldData)) return [optimisticModality];
            return [...oldData, optimisticModality];
          }
        );

        // ⚡ STEP 2: FIRE AND FORGET
        createMutation.mutate({
          name: data.name,
          organizationId,
          createdBy: currentMember.id
        }, {
          onSuccess: (newModality) => {
            // Reemplazar optimista con real
            queryClient.setQueryData(
              ['project-modalities', organizationId],
              (oldData: any) => {
                if (!Array.isArray(oldData)) return [newModality];
                return oldData.map((m: any) => m.id === optimisticModality.id ? newModality : m);
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

export type { ProjectModality, ProjectModalityFormData };
