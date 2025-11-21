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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/features/organization/hooks/use-organization-members';
import { createSiteLogType } from '../services/createSiteLogType';
import { updateSiteLogType } from '../services/updateSiteLogType';
import type { SiteLogType } from '../services/getSiteLogTypes';

// Schema de validación
const siteLogTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  code: z.string()
    .min(1, 'El código es requerido')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[A-Z0-9_-]+$/, 'Solo mayúsculas, números, guiones y guiones bajos'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  icon: z.string().max(50, 'Máximo 50 caracteres').optional(),
  color: z.string()
    .refine(
      (val) => !val || /^#[0-9A-Fa-f]{6}$/.test(val),
      'Debe ser un color hexadecimal válido (#RRGGBB)'
    )
    .optional(),
});

type SiteLogTypeFormData = z.infer<typeof siteLogTypeSchema>;

interface SiteLogTypeModalProps {
  modalData?: {
    siteLogType?: SiteLogType;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function SiteLogTypeModal({ modalData, onClose }: SiteLogTypeModalProps) {
  const { siteLogType, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const { data: members = [] } = useOrganizationMembers(userData?.organization?.id);

  const form = useForm<SiteLogTypeFormData>({
    resolver: zodResolver(siteLogTypeSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      icon: '',
      color: undefined,
    }
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (siteLogType) {
      form.reset({
        name: siteLogType.name || '',
        code: siteLogType.code || '',
        description: siteLogType.description || '',
        icon: siteLogType.icon || '',
        color: siteLogType.color || undefined,
      });
    } else {
      form.reset({
        name: '',
        code: '',
        description: '',
        icon: '',
        color: undefined,
      });
    }
  }, [siteLogType, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Define mutations inline siguiendo el patrón GOLD STANDARD de SiteLogModal
  const createMutation = useMutation({
    mutationFn: createSiteLogType,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sitelog-types', variables.organizationId] });
      toast({
        title: 'Tipo creado',
        description: 'El tipo de bitácora se creó correctamente'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating site log type:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el tipo de bitácora',
        variant: 'destructive'
      });
    }
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
        description: 'El tipo de bitácora se actualizó correctamente'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating site log type:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el tipo de bitácora',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: SiteLogTypeFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener la información de la organización',
        variant: 'destructive'
      });
      return;
    }

    if (isEditing && siteLogType) {
      updateMutation.mutate({
        typeId: siteLogType.id,
        organizationId: userData.organization.id,
        data: {
          name: data.name,
          code: data.code,
          description: data.description || null,
          icon: data.icon || null,
          color: data.color || null,
        }
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
      
      createMutation.mutate({
        name: data.name,
        code: data.code,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
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
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Código <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: EVENTOS_ESPECIALES" 
                  {...field}
                  onChange={(e) => {
                    const formatted = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9\-_]/g, '');
                    field.onChange(formatted);
                  }}
                  data-testid="input-sitelog-type-code"
                  maxLength={50}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Solo mayúsculas, números, guiones y guiones bajos
              </p>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icono (opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: star" 
                    {...field}
                    data-testid="input-sitelog-type-icon"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Nombre del icono de Lucide React
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color (opcional)</FormLabel>
                <div className="flex gap-2">
                  {field.value && (
                    <FormControl>
                      <Input 
                        type="color" 
                        value={field.value}
                        onChange={field.onChange}
                        className="w-16 h-10 p-1 cursor-pointer"
                        data-testid="input-sitelog-type-color"
                      />
                    </FormControl>
                  )}
                  {!field.value && (
                    <div 
                      onClick={() => field.onChange('#84cc16')}
                      className="w-16 h-10 border border-input rounded-md flex items-center justify-center cursor-pointer hover:bg-accent"
                      data-testid="button-sitelog-type-color-placeholder"
                    >
                      <div className="w-6 h-6 rounded border border-border bg-muted" />
                    </div>
                  )}
                  <Input 
                    placeholder="#84cc16" 
                    value={field.value || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        field.onChange(undefined);
                      } else if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        field.onChange(val);
                      }
                    }}
                    className="flex-1"
                    maxLength={7}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? 'Editar Tipo' : 'Nuevo Tipo'}
      description={isEditing 
        ? 'Modifica los detalles del tipo de bitácora'
        : 'Crea un nuevo tipo de bitácora personalizado para tu organización'
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
