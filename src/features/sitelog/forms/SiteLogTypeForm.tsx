import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/features/organization/hooks/use-organization-members';
import { createSiteLogType } from '@/features/sitelog/services/createSiteLogType';
import { updateSiteLogType } from '@/features/sitelog/services/updateSiteLogType';
import type { SiteLogType } from '@/features/sitelog/services/getSiteLogTypes';

const siteLogTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type SiteLogTypeFormData = z.infer<typeof siteLogTypeSchema>;

// Subcomponente: Formulario para create/edit
function FormPanel({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<SiteLogTypeFormData>>;
  onSubmit: (data: SiteLogTypeFormData) => void;
}) {
  return (
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
                  placeholder="Ej: Eventos Especiales"
                  {...field}
                  data-testid="input-sitelog-type-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción del tipo de bitácora..."
                  {...field}
                  rows={3}
                  data-testid="textarea-sitelog-type-description"
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

// Subcomponente: Vista de lectura
function ViewPanel({ data }: { data: SiteLogType }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Nombre</p>
        <p className="font-medium">{data.name}</p>
      </div>
      {data.description && (
        <div>
          <p className="text-sm text-muted-foreground">Descripción</p>
          <p className="text-sm">{data.description}</p>
        </div>
      )}
    </div>
  );
}

interface SiteLogTypeFormProps {
  modalData?: {
    siteLogType?: SiteLogType;
    siteLogTypeId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function SiteLogTypeForm({
  modalData,
  onClose,
  mode = 'create',
}: SiteLogTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { siteLogType } = modalData || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const { data: members = [] } = useOrganizationMembers(userData?.organization?.id);

  const form = useForm<SiteLogTypeFormData>({
    resolver: zodResolver(siteLogTypeSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Cargar datos si es edición o vista
  useEffect(() => {
    if (siteLogType) {
      form.reset({
        name: siteLogType.name || '',
        description: siteLogType.description || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
      });
    }
  }, [siteLogType]);

  const createMutation = useMutation({
    mutationFn: createSiteLogType,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sitelog-types', variables.organizationId] });
      toast({
        title: 'Tipo creado',
        description: 'El tipo de bitácora se creó correctamente',
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating site log type:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el tipo de bitácora',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ typeId, organizationId, data }: {
      typeId: string;
      organizationId: string;
      data: any;
    }) => updateSiteLogType(typeId, organizationId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sitelog-types', variables.organizationId] });
      toast({
        title: 'Tipo actualizado',
        description: 'El tipo de bitácora se actualizó correctamente',
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error updating site log type:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el tipo de bitácora',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SiteLogTypeFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener la información de la organización',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    if (mode === 'edit' && siteLogType) {
      updateMutation.mutate({
        typeId: siteLogType.id,
        organizationId: userData.organization.id,
        data: {
          name: data.name,
          description: data.description || null,
        },
      });
    } else if (mode === 'create') {
      const currentMember = members.find((m: any) => m.user_id === userData?.user?.id);
      if (!currentMember) {
        toast({
          title: 'Error',
          description: 'No se encontró el miembro de la organización',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      createMutation.mutate({
        name: data.name,
        description: data.description || null,
        organizationId: userData.organization.id,
        createdBy: currentMember.id,
      });
    }
  };

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: siteLogType?.name || 'Tipo de Bitácora',
          description: 'Detalles del tipo de bitácora',
        };
      case 'edit':
        return {
          title: 'Editar Tipo',
          description: 'Modifica los detalles del tipo de bitácora',
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Tipo',
          description: 'Crea un nuevo tipo de bitácora personalizado para tu organización',
        };
    }
  };

  const header = getHeader();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={Tag}
      />

      <ModalBody>
        {mode === 'view' ? (
          siteLogType && <ViewPanel data={siteLogType} />
        ) : (
          <FormPanel form={form} onSubmit={onSubmit} />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          rightLabel={mode === 'create' ? 'Crear Tipo' : 'Guardar Cambios'}
          onRightClick={form.handleSubmit(onSubmit)}
          isSubmitting={isLoading}
        />
      )}
    </ModalLayout>
  );
}
